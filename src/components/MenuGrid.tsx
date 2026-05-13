'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import type { MenuByCategory, MenuItem } from '@/lib/getMenu'
import type { Json } from '@/lib/types'

type CustomizationOption = string | { label: string; price_delta: number; available?: boolean }
type CustomizationGroup = { name: string; required?: boolean; multiple?: boolean; options: CustomizationOption[] }
type CustomizationOptions = { groups: CustomizationGroup[] }

const optLabel = (o: CustomizationOption) => (typeof o === 'string' ? o : o.label)
const optDelta = (o: CustomizationOption) => (typeof o === 'string' ? 0 : o.price_delta)
const optAvailable = (o: CustomizationOption) => typeof o === 'string' || o.available !== false

function parseCustomGroups(opts: Json | null): CustomizationGroup[] {
  return (opts as CustomizationOptions | null)?.groups ?? []
}

function hasCustomization(item: MenuItem): boolean {
  return parseCustomGroups(item.customization_options).length > 0 || item.modifiers.length > 0
}

export default function MenuGrid({ menu }: { menu: MenuByCategory }) {
  const categories = Object.keys(menu)
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '')
  const [customizing, setCustomizing] = useState<MenuItem | null>(null)
  const { items, addItem } = useCart()
  const { locale, t } = useLocale()

  // Sum quantities across all modifier variants of the same base item for the badge
  const cartQtyByBase = new Map<string, number>()
  for (const i of items) {
    cartQtyByBase.set(i.menu_item_id, (cartQtyByBase.get(i.menu_item_id) ?? 0) + i.quantity)
  }

  function categoryLabel(cat: string): string {
    if (locale !== 'en') return cat
    const firstItem = menu[cat]?.[0]
    return firstItem?.category_en ?? cat
  }

  function handleAdd(item: MenuItem) {
    if (hasCustomization(item)) {
      setCustomizing(item)
      return
    }
    const displayName = locale === 'en' && item.name_en ? item.name_en : item.name
    addItem({
      menu_item_id: item.id,
      name: displayName,
      unit_price: item.price,
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs — underline indicator */}
      <div className="flex overflow-x-auto border-b border-cafe-border bg-cafe-bg sticky top-0 z-10 shrink-0">
        {categories.map(cat => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors shrink-0 ${
                active ? 'text-cafe-bar' : 'text-cafe-text/60 hover:text-cafe-text'
              }`}
            >
              {categoryLabel(cat)}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-3 right-3 -bottom-px h-0.5 bg-cafe-bar rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Food grid */}
      <div className="grid grid-cols-2 gap-3 p-3">
        {(menu[activeCategory] ?? []).map((item, index) => {
          const qty = cartQtyByBase.get(item.id) ?? 0
          const customizable = hasCustomization(item)
          const displayName = locale === 'en' && item.name_en ? item.name_en : item.name
          const displayDesc = locale === 'en' && item.description_en ? item.description_en : item.description
          return (
            <div
              key={item.id}
              className="bg-cafe-card border border-cafe-border rounded-lg overflow-hidden flex flex-col"
            >
              {item.image_url ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={item.image_url}
                    alt={displayName}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    priority={index < 4}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSIzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNlNWUwZGIiLz48L3N2Zz4="
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-cafe-border flex items-center justify-center text-cafe-text/30 text-xs">
                  {t('menu.noImage')}
                </div>
              )}

              <div className="p-2 flex flex-col flex-1">
                <p className="text-cafe-text font-medium text-sm leading-snug line-clamp-2">{displayName}</p>
                {displayDesc && (
                  <p className="text-cafe-text/60 text-xs mt-0.5 leading-snug line-clamp-2">{displayDesc}</p>
                )}
                {customizable && (
                  <p className="text-cafe-text/50 text-[11px] mt-1">{t('menu.customizable')}</p>
                )}

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-cafe-bar font-bold text-sm">${item.price}</span>
                  <div className="relative">
                    <button
                      onClick={() => handleAdd(item)}
                      className="bg-cafe-bar text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl leading-none hover:opacity-90 transition-opacity"
                      aria-label={t('menu.addToCart', { name: displayName })}
                    >
                      +
                    </button>
                    {qty > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold pointer-events-none">
                        {qty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {customizing && (
        <CustomizationSheet
          item={customizing}
          onClose={() => setCustomizing(null)}
          onConfirm={(payload) => {
            addItem(payload)
            setCustomizing(null)
          }}
        />
      )}
    </div>
  )
}

type ConfirmPayload = {
  menu_item_id: string
  name: string
  unit_price: number
  modifier?: { id: string; name: string; price_delta: number }
  customization_note?: string
  customization_price_delta?: number
}

function CustomizationSheet({
  item,
  onClose,
  onConfirm,
}: {
  item: MenuItem
  onClose: () => void
  onConfirm: (payload: ConfirmPayload) => void
}) {
  const { locale, t } = useLocale()

  const displayName = locale === 'en' && item.name_en ? item.name_en : item.name
  const cnGroups = parseCustomGroups(item.customization_options)
  const enGroupsRaw = locale === 'en' && item.customization_options_en
    ? parseCustomGroups(item.customization_options_en)
    : null

  // EN labels come from customization_options_en; availability always comes from customization_options (CN)
  const groups = enGroupsRaw
    ? enGroupsRaw.map((g, gi) => ({
        ...g,
        options: g.options.map((opt, oi) => {
          const cnAvail = optAvailable(cnGroups[gi]?.options[oi] ?? opt)
          return cnAvail ? opt
            : typeof opt === 'string' ? { label: opt, price_delta: 0, available: false }
            : { ...opt, available: false }
        }),
      }))
    : cnGroups

  const [customizations, setCustomizations] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const g of groups) {
      const firstAvailable = g.options.find(optAvailable)
      initial[g.name] = g.required && firstAvailable ? [optLabel(firstAvailable)] : []
    }
    return initial
  })
  const [modifierId, setModifierId] = useState<string>('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const selectedModifier = item.modifiers.find(m => m.id === modifierId)

  const customizationDelta = groups.reduce((sum, g) => {
    const selected = customizations[g.name] ?? []
    return sum + g.options
      .filter(o => selected.includes(optLabel(o)))
      .reduce((s, o) => s + optDelta(o), 0)
  }, 0)

  const totalPrice = item.price + customizationDelta + (selectedModifier ? Number(selectedModifier.price_delta) : 0)

  function handleConfirm() {
    const note = groups
      .map(g => (customizations[g.name] ?? []).join('、'))
      .filter(Boolean)
      .join(' / ') || undefined

    onConfirm({
      menu_item_id: item.id,
      name: displayName,
      unit_price: item.price + customizationDelta,
      modifier: selectedModifier
        ? {
            id: selectedModifier.id,
            name: locale === 'en' && selectedModifier.name_en ? selectedModifier.name_en : selectedModifier.name,
            price_delta: Number(selectedModifier.price_delta),
          }
        : undefined,
      customization_note: note,
      customization_price_delta: customizationDelta || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('customization.title', { name: displayName })}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative w-full md:max-w-md bg-cafe-card rounded-t-2xl md:rounded-2xl md:mb-8 max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cafe-border shrink-0">
          <span className="font-semibold text-cafe-text">{displayName}</span>
          <button
            onClick={onClose}
            aria-label={t('customization.close')}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-cafe-text/60 hover:text-cafe-text text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {groups.map(group => (
            <div key={group.name}>
              <p className="text-xs font-medium text-cafe-text/70 mb-2">
                {group.name}
                {group.required && <span className="text-red-500 ml-1">*</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {!group.required && (
                  <OptionChip
                    label={t('customization.noSelection', { group: group.name })}
                    selected={!(customizations[group.name]?.length)}
                    onClick={() =>
                      setCustomizations(prev => ({ ...prev, [group.name]: [] }))
                    }
                  />
                )}
                {group.options.filter(optAvailable).map(opt => {
                  const label = optLabel(opt)
                  const delta = optDelta(opt)
                  return (
                    <OptionChip
                      key={label}
                      label={delta > 0 ? `${label} +$${delta}` : label}
                      selected={customizations[group.name]?.includes(label) ?? false}
                      onClick={() =>
                        setCustomizations(prev => {
                          if (group.multiple) {
                            const cur = prev[group.name] ?? []
                            const next = cur.includes(label) ? cur.filter(o => o !== label) : [...cur, label]
                            return { ...prev, [group.name]: next }
                          }
                          return { ...prev, [group.name]: [label] }
                        })
                      }
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {item.modifiers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-cafe-text/70 mb-2">{t('customization.addOns')}</p>
              <div className="flex flex-wrap gap-2">
                <OptionChip
                  label={t('customization.noAddOns')}
                  selected={modifierId === ''}
                  onClick={() => setModifierId('')}
                />
                {item.modifiers.map(mod => {
                  const modName = locale === 'en' && mod.name_en ? mod.name_en : mod.name
                  return (
                    <OptionChip
                      key={mod.id}
                      label={`${modName} +$${mod.price_delta}`}
                      selected={modifierId === mod.id}
                      onClick={() => setModifierId(mod.id)}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-cafe-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full bg-cafe-bar text-white py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span>{t('customization.addToCartBtn')}</span>
            <span className="tabular-nums">${totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
        selected
          ? 'bg-cafe-bar text-white border-cafe-bar'
          : 'bg-cafe-card text-cafe-text border-cafe-border hover:border-cafe-bar/40'
      }`}
    >
      {label}
    </button>
  )
}
