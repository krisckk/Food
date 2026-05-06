import { NextRequest, NextResponse } from 'next/server'
import { updateSummaryStatus } from '@/lib/notion'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const syncAll = searchParams.get('all') === 'true'

  try {
    const supabase = createSupabaseAdminClient()
    
    if (syncAll) {
      // Sync all recently active orders
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id')
        .neq('status', 'Done')
        .order('created_at', { ascending: false })
        .limit(5) // Limit to avoid hitting Notion rate limits too hard

      if (activeOrders) {
        for (const order of activeOrders) {
          const newStatus = await updateSummaryStatus(order.id)
          if (newStatus) {
            await supabase.from('orders').update({ status: newStatus }).eq('id', order.id)
          }
        }
      }
      return NextResponse.json({ success: true, count: activeOrders?.length || 0 })
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const newStatus = await updateSummaryStatus(orderId)
    
    if (newStatus) {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[sync] Sync failed:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Existing webhook logic
  try {
    const body = await req.json()
    console.log('[webhook] Received payload:', JSON.stringify(body, null, 2))
    
    const page = body.data || body
    let orderId = ''
    
    const orderIdProp = page.properties?.['Order ID']
    if (orderIdProp?.title?.[0]?.text?.content) {
      orderId = orderIdProp.title[0].text.content
    } else if (body.order_id) {
      orderId = body.order_id
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID not found' }, { status: 400 })
    }

    const newStatus = await updateSummaryStatus(orderId)

    if (newStatus) {
      const supabase = createSupabaseAdminClient()
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[webhook] Notion sync failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
