import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

type MenuItem = Tables<'menu_items'>
type MenuByCategory = Record<string, MenuItem[]>

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped = (data ?? []).reduce<MenuByCategory>((acc, item) => {
    ;(acc[item.category] ??= []).push(item)
    return acc
  }, {})

  return NextResponse.json(grouped)
}
