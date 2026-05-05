import { createSupabaseServerClient } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

export type MenuItem = Tables<'menu_items'>
export type MenuByCategory = Record<string, MenuItem[]>

export async function getMenu(): Promise<MenuByCategory> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('name')

  if (error) throw new Error(error.message)

  return (data ?? []).reduce<MenuByCategory>((acc, item) => {
    ;(acc[item.category] ??= []).push(item)
    return acc
  }, {})
}
