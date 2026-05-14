import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Manual sync removed' })
}

export async function POST(req: NextRequest) {
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

    const statusProp = page.properties?.['Status']
    const newStatus = statusProp?.status?.name || statusProp?.select?.name

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
