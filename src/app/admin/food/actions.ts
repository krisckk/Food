'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function toggleItemAvailability(id: string, available: boolean) {
  const supabase = createSupabaseAdminClient()
  
  const { error } = await supabase
    .from('menu_items')
    .update({ available })
    .eq('id', id)
  
  if (error) {
    console.error('[Admin] Failed to update availability:', error)
    throw new Error('Failed to update availability')
  }

  // Revalidate the pages so the new status reflects immediately for users
  revalidatePath('/')
  revalidatePath('/admin/food')
  
  return { success: true }
}
