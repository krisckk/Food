'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Json } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function toggleModifierAvailability(id: string, available: boolean) {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('menu_item_modifiers')
    .update({ available })
    .eq('id', id)

  if (error) {
    console.error('[Admin] Failed to update modifier availability:', error)
    throw new Error('Failed to update modifier availability')
  }

  revalidatePath('/')
  revalidatePath('/admin/choice')
  return { success: true }
}

export async function toggleCustomizationOption(
  menuItemId: string,
  newOptions: Json,
) {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('menu_items')
    .update({ customization_options: newOptions })
    .eq('id', menuItemId)

  if (error) {
    console.error('[Admin] Failed to update customization option:', error)
    throw new Error('Failed to update customization option')
  }

  revalidatePath('/')
  revalidatePath('/admin/choice')
  return { success: true }
}
