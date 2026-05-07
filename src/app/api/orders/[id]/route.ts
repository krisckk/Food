import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ status: data.status })
}
