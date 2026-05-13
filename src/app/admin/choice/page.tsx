import { createSupabaseServerClient } from '@/lib/supabase'
import AdminChoiceClient from './AdminChoiceClient'

export const dynamic = 'force-dynamic'

export default async function AdminChoicePage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: rawModifiers, error: modErr }, { data: menuItems, error: miErr }, { data: items, error: itemErr }] = await Promise.all([
    supabase
      .from('menu_item_modifiers')
      .select('id, name, name_en, available, price_delta, display_order, menu_item_id')
      .order('menu_item_id')
      .order('display_order'),
    supabase
      .from('menu_items')
      .select('id, name, category'),
    supabase
      .from('menu_items')
      .select('id, name, category, customization_options')
      .not('customization_options', 'is', null)
      .order('category')
      .order('name'),
  ])

  if (modErr || miErr || itemErr) {
    return (
      <div className="p-8 text-red-500 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Error loading data</h1>
        <p>{modErr?.message ?? miErr?.message ?? itemErr?.message}</p>
      </div>
    )
  }

  const menuItemMap = Object.fromEntries((menuItems ?? []).map(i => [i.id, i]))
  const modifiers = (rawModifiers ?? []).map(m => ({
    ...m,
    menu_items: menuItemMap[m.menu_item_id] ?? null,
  }))

  return (
    <AdminChoiceClient
      initialModifiers={modifiers as unknown as Parameters<typeof AdminChoiceClient>[0]['initialModifiers']}
      initialItems={(items ?? []) as unknown as Parameters<typeof AdminChoiceClient>[0]['initialItems']}
    />
  )
}
