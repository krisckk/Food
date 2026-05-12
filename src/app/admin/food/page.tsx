import { createSupabaseServerClient } from '@/lib/supabase'
import AdminMenuClient from './AdminMenuClient'

// Ensure this page always fetches the latest data instead of caching at build time
export const dynamic = 'force-dynamic'

export default async function AdminFoodPage() {
  const supabase = await createSupabaseServerClient()
  
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, category, available')
    .order('category')
    .order('name')

  if (error) {
    return (
      <div className="p-8 text-red-500 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Error loading menu</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return <AdminMenuClient initialItems={items || []} />
}
