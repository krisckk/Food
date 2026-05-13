'use client'

import { useState, useTransition } from 'react'
import { toggleModifierAvailability, toggleCustomizationOption } from './actions'

type ModifierWithItem = {
  id: string
  name: string
  name_en: string | null
  available: boolean
  price_delta: number
  display_order: number
  menu_item_id: string
  menu_items: { name: string; category: string } | null
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

type MenuItemWithCustomizations = {
  id: string
  name: string
  category: string
  customization_options: { groups: CustomizationGroup[] }
}

function getOptionLabel(opt: OptionValue): string {
  return typeof opt === 'string' ? opt : opt.label
}

function getOptionAvailable(opt: OptionValue): boolean {
  if (typeof opt === 'string') return true
  return opt.available !== false
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
  return (
    <div className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-8' : 'translate-x-1'}`} />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}

export default function AdminChoiceClient({
  initialModifiers,
  initialItems,
}: {
  initialModifiers: ModifierWithItem[]
  initialItems: MenuItemWithCustomizations[]
}) {
  const [modifiers, setModifiers] = useState(initialModifiers)
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()

  const handleModifierToggle = (id: string, current: boolean) => {
    setModifiers(prev => prev.map(m => m.id === id ? { ...m, available: !current } : m))
    startTransition(async () => {
      try {
        await toggleModifierAvailability(id, !current)
      } catch {
        alert('Failed to update modifier. Please try again.')
        setModifiers(initialModifiers)
      }
    })
  }

  const handleOptionToggle = (
    itemId: string,
    groupIndex: number,
    optionIndex: number,
    current: boolean,
  ) => {
    const currentItem = items.find(item => item.id === itemId)
    if (!currentItem) return

    const newGroups = currentItem.customization_options.groups.map((g, gi) => {
      if (gi !== groupIndex) return g
      const options = g.options.map((opt, oi) => {
        if (oi !== optionIndex) return opt
        return typeof opt === 'string'
          ? { label: opt, available: !current }
          : { ...opt, available: !current }
      })
      return { ...g, options }
    })
    const newOptions = { groups: newGroups }

    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, customization_options: newOptions } : item
    ))

    startTransition(async () => {
      try {
        await toggleCustomizationOption(itemId, newOptions)
      } catch {
        alert('Failed to update option. Please try again.')
        setItems(initialItems)
      }
    })
  }

  const modifiersByItem = modifiers.reduce<Record<string, ModifierWithItem[]>>((acc, m) => {
    const key = m.menu_item_id
    acc[key] = acc[key] ?? []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen text-gray-900 font-sans">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">KrisFood Admin</h1>
        <p className="text-gray-500 mt-2">Manage modifier and customization option availability.</p>
      </div>

      {/* Section A: Modifiers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Modifiers</h2>
        {Object.entries(modifiersByItem).map(([itemId, mods]) => {
          const itemName = mods[0].menu_items?.name ?? itemId
          return (
            <div key={itemId} className="mb-8">
              <h3 className="text-lg font-bold mb-3 bg-gray-100 p-3 rounded-md">{itemName}</h3>
              <div className="grid gap-3">
                {mods.map(mod => (
                  <label
                    key={mod.id}
                    className="flex items-center justify-between p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-medium">
                      {mod.name}
                      {mod.price_delta > 0 && (
                        <span className="ml-2 text-sm text-gray-500">+${mod.price_delta}</span>
                      )}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold ${mod.available ? 'text-green-600' : 'text-red-600'}`}>
                        {mod.available ? '● Available' : 'Unavailable'}
                      </span>
                      <ToggleSwitch
                        checked={mod.available}
                        onChange={() => handleModifierToggle(mod.id, mod.available)}
                        disabled={isPending}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
        {modifiers.length === 0 && (
          <p className="text-gray-400">No modifiers found.</p>
        )}
      </section>

      {/* Section B: Customization Options */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Customization Options</h2>
        {items.map(item => (
          <div key={item.id} className="mb-8">
            <h3 className="text-lg font-bold mb-3 bg-gray-100 p-3 rounded-md">{item.name}</h3>
            {item.customization_options.groups.map((group, gi) => (
              <div key={gi} className="mb-4 ml-2">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  {group.name}
                  {group.required && <span className="ml-1 text-red-400 text-xs">(required)</span>}
                </p>
                <div className="grid gap-2">
                  {group.options.map((opt, oi) => {
                    const label = getOptionLabel(opt)
                    const available = getOptionAvailable(opt)
                    return (
                      <label
                        key={oi}
                        className="flex items-center justify-between p-3 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-base">{label}</span>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-semibold ${available ? 'text-green-600' : 'text-red-600'}`}>
                            {available ? '● Available' : 'Unavailable'}
                          </span>
                          <ToggleSwitch
                            checked={available}
                            onChange={() => handleOptionToggle(item.id, gi, oi, available)}
                            disabled={isPending}
                          />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400">No customization options found.</p>
        )}
      </section>
    </div>
  )
}
