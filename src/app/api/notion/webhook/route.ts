import { NextRequest, NextResponse } from 'next/server'
import { updateSummaryStatus } from '@/lib/notion'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  try {
    const newStatus = await updateSummaryStatus(orderId)
    
    if (newStatus) {
      const supabase = createSupabaseAdminClient()
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[sync] Manual sync failed:', err)
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
