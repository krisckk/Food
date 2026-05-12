import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[menu-webhook] Received payload:', JSON.stringify(body, null, 2))
    
    // Notion Webhook Payloads can vary depending on how they are sent (Notion Automations vs Custom Integrations)
    // We expect the data to contain properties of the page that was updated
    const page = body.data || body
    const properties = page.properties

    if (!properties) {
      return NextResponse.json({ error: 'No properties found in payload' }, { status: 400 })
    }

    // 1. Extract Name (from Title property)
    const nameProp = properties['Name'] || properties['title']
    const itemName = nameProp?.title?.[0]?.text?.content || nameProp?.rich_text?.[0]?.text?.content
    
    if (!itemName) {
      return NextResponse.json({ error: 'Item Name not found in properties' }, { status: 400 })
    }

    // 2. Extract Availability Status
    // We check for both "Available" (checkbox) and "Status" (select/status)
    let isAvailable = true

    // Checkbox: "Available"
    const availableProp = properties['Available']
    if (availableProp?.type === 'checkbox') {
      isAvailable = availableProp.checkbox
    } 
    // Status/Select: "Status"
    else {
      const statusProp = properties['Status']
      const statusName = statusProp?.status?.name || statusProp?.select?.name
      if (statusName === '賣完' || statusName === 'Sold Out') {
        isAvailable = false
      }
    }

    console.log(`[menu-webhook] Updating ${itemName}: available = ${isAvailable}`)

    // 3. Update Supabase
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('menu_items')
      .update({ available: isAvailable })
      .eq('name', itemName)

    if (error) {
      console.error('[menu-webhook] Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: itemName, available: isAvailable })
  } catch (err) {
    console.error('[menu-webhook] Webhook processing failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
