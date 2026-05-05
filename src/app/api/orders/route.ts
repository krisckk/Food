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
        modifier_id: z.string().uuid().nullable().optional(),
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
    .select('id, name, price, available')
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

  // Fetch modifiers in a single IN query (skipped when no modifiers present)
  const modifierIds = Array.from(new Set(items.flatMap((i) => (i.modifier_id ? [i.modifier_id] : []))))
  type ModifierRow = { id: string; name: string; price_delta: number; available: boolean; menu_item_id: string }
  let modifierMap = new Map<string, ModifierRow>()

  if (modifierIds.length > 0) {
    const { data: mods, error: modErr } = await supabase
      .from('menu_item_modifiers')
      .select('id, name, price_delta, available, menu_item_id')
      .in('id', modifierIds)

    if (modErr) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    modifierMap = new Map(mods.map((m) => [m.id, { ...m, price_delta: Number(m.price_delta) }]))
  }

  // Validate each modifier is available and belongs to the ordered item
  for (const item of items) {
    if (item.modifier_id) {
      const mod = modifierMap.get(item.modifier_id)
      if (!mod?.available) {
        return NextResponse.json({ error: `Modifier ${item.modifier_id} unavailable` }, { status: 422 })
      }
      if (mod.menu_item_id !== item.menu_item_id) {
        return NextResponse.json({ error: 'Modifier does not belong to item' }, { status: 422 })
      }
    }
  }

  const total = items.reduce((sum, i) => {
    const base = priceMap.get(i.menu_item_id)!.price
    const delta = i.modifier_id ? (modifierMap.get(i.modifier_id)?.price_delta ?? 0) : 0
    return sum + (base + delta) * i.quantity
  }, 0)

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ customer_name, customer_email, total })
    .select()
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const { error: itemsErr } = await supabase.from('order_items').insert(
    items.map((i) => {
      const base = priceMap.get(i.menu_item_id)!.price
      const mod = i.modifier_id ? modifierMap.get(i.modifier_id) : undefined
      return {
        order_id: order.id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        unit_price: base + (mod?.price_delta ?? 0),
        modifier_id: i.modifier_id ?? null,
        modifier_name: mod?.name ?? null,
      }
    }),
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
      items.map((i) => {
        const mod = i.modifier_id ? modifierMap.get(i.modifier_id) : undefined
        return {
          menu_item_id: i.menu_item_id,
          name: mod
            ? `${priceMap.get(i.menu_item_id)!.name} + ${mod.name}`
            : priceMap.get(i.menu_item_id)!.name,
          quantity: i.quantity,
          unit_price: priceMap.get(i.menu_item_id)!.price + (mod?.price_delta ?? 0),
        }
      }),
    )
    await supabase.from('orders').update({ notion_page_id: notionPageId }).eq('id', order.id)
  } catch (err) {
    console.error('[notion] sync failed:', err)
  }

  // Merge notion_page_id so caller sees the stored value without a re-fetch
  return NextResponse.json({ order: { ...order, notion_page_id: notionPageId } })
}
