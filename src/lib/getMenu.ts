import { createSupabaseServerClient } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

export type MenuItemModifier = Tables<'menu_item_modifiers'>
export type MenuItem = Tables<'menu_items'> & { modifiers: MenuItemModifier[] }
export type MenuByCategory = Record<string, MenuItem[]>

export async function getMenu(): Promise<MenuByCategory> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, menu_item_modifiers(*)')
    .eq('available', true)
    .order('name')

  if (error) throw new Error(error.message)

  return (data ?? []).reduce<MenuByCategory>((acc, item) => {
    const typed = item as unknown as MenuItem
    typed.modifiers = (typed.modifiers as MenuItemModifier[] | null) ?? []
    ;(acc[item.category] ??= []).push(typed)
    return acc
  }, {})
}
