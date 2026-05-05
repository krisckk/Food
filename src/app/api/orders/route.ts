import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { syncOrderToNotion } from '@/lib/notion'

const schema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().optional(),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { customer_name, customer_email, items } = parsed.data
  const supabase = createSupabaseAdminClient()
  const ids = items.map((i) => i.menu_item_id)

  const { data: menuItems, error: menuErr } = await supabase
    .from('menu_items')
    .select('id, price, available')
    .in('id', ids)

  if (menuErr) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const priceMap = new Map(menuItems.map((m) => [m.id, m]))
  for (const item of items) {
    const m = priceMap.get(item.menu_item_id)
    if (!m?.available) {
      return NextResponse.json(
        { error: `Item ${item.menu_item_id} unavailable` },
        { status: 422 },
      )
    }
  }

  const total = items.reduce(
    (sum, i) => sum + priceMap.get(i.menu_item_id)!.price * i.quantity,
    0,
  )

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ customer_name, customer_email, total })
    .select()
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const { error: itemsErr } = await supabase.from('order_items').insert(
    items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: priceMap.get(i.menu_item_id)!.price,
    })),
  )

  if (itemsErr) {
    // Compensating delete — keep DB consistent if items insert fails
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to save items' }, { status: 500 })
  }

  // Notion sync — failure must not block the order response
  let notionPageId: string | null = null
  try {
    notionPageId = await syncOrderToNotion(
      order,
      items.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        unit_price: priceMap.get(i.menu_item_id)!.price,
      })),
    )
    await supabase.from('orders').update({ notion_page_id: notionPageId }).eq('id', order.id)
  } catch (err) {
    console.error('[notion] sync failed:', err)
  }

  // Merge notion_page_id so caller sees the stored value without a re-fetch
  return NextResponse.json({ order: { ...order, notion_page_id: notionPageId } })
}
