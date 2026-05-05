import { createSupabaseServerClient } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

export type MenuItemModifier = Tables<'menu_item_modifiers'>
export type MenuItem = Tables<'menu_items'> & { modifiers: MenuItemModifier[] }
export type MenuByCategory = Record<string, MenuItem[]>

export async function getMenu(): Promise<MenuByCategory> {
  const supabase = await createSupabaseServerClient()

  const [itemsRes, modsRes] = await Promise.all([
    supabase.from('menu_items').select('*').eq('available', true).order('name'),
    supabase.from('menu_item_modifiers').select('*').eq('available', true).order('display_order'),
  ])

  if (itemsRes.error) throw new Error(itemsRes.error.message)
  if (modsRes.error) throw new Error(modsRes.error.message)

  const modsByItem = new Map<string, MenuItemModifier[]>()
  for (const mod of modsRes.data ?? []) {
    const arr = modsByItem.get(mod.menu_item_id) ?? []
    arr.push(mod)
    modsByItem.set(mod.menu_item_id, arr)
  }

  return (itemsRes.data ?? []).reduce<MenuByCategory>((acc, item) => {
    const typed: MenuItem = { ...item, modifiers: modsByItem.get(item.id) ?? [] }
    ;(acc[item.category] ??= []).push(typed)
    return acc
  }, {})
}
