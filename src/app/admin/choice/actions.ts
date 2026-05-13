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

type OptionValue =
  | string
  | { label: string; price_delta?: number; available?: boolean }

type CustomizationGroup = {
  name: string
  required: boolean
  multiple?: boolean
  options: OptionValue[]
}

type CustomizationOptions = { groups: CustomizationGroup[] }

export async function toggleCustomizationOption(
  menuItemId: string,
  groupIndex: number,
  optionIndex: number,
  available: boolean,
) {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('customization_options')
    .eq('id', menuItemId)
    .single()

  if (error || !data) {
    console.error('[Admin] Failed to fetch item customization options:', error)
    throw new Error('Failed to fetch item')
  }

  const opts = structuredClone(data.customization_options) as CustomizationOptions
  const option = opts.groups[groupIndex].options[optionIndex]

  opts.groups[groupIndex].options[optionIndex] =
    typeof option === 'string'
      ? { label: option, available }
      : { ...option, available }

  const { error: updateError } = await supabase
    .from('menu_items')
    .update({ customization_options: opts as unknown as Json })
    .eq('id', menuItemId)

  if (updateError) {
    console.error('[Admin] Failed to update customization option:', updateError)
    throw new Error('Failed to update customization option')
  }

  revalidatePath('/')
  revalidatePath('/admin/choice')
  return { success: true }
}
