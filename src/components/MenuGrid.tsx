'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import type { MenuByCategory } from '@/lib/getMenu'

export default function MenuGrid({ menu }: { menu: MenuByCategory }) {
  const categories = Object.keys(menu)
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '')
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({})
  const { items, addItem } = useCart()

  // Sum quantities across all modifier variants of the same base item for the badge
  const cartQtyByBase = new Map<string, number>()
  for (const i of items) {
    cartQtyByBase.set(i.menu_item_id, (cartQtyByBase.get(i.menu_item_id) ?? 0) + i.quantity)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-cafe-border bg-cafe-bg sticky top-0 z-10 shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors shrink-0 ${
              activeCategory === cat
                ? 'bg-cafe-bar text-white'
                : 'text-cafe-text hover:bg-cafe-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food grid */}
      <div className="grid grid-cols-2 gap-3 p-3">
        {(menu[activeCategory] ?? []).map(item => {
          const qty = cartQtyByBase.get(item.id) ?? 0
          return (
            <div
              key={item.id}
              className="bg-cafe-card border border-cafe-border rounded-lg overflow-hidden flex flex-col"
            >
              {item.image_url ? (
                <div className="relative h-28 w-full">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-28 bg-cafe-border flex items-center justify-center text-cafe-text/30 text-xs">
                  無圖片
                </div>
              )}

              <div className="p-2 flex flex-col flex-1">
                <p className="text-cafe-text font-medium text-sm leading-snug">{item.name}</p>
                {item.description && (
                  <p className="text-cafe-text/60 text-xs mt-0.5 leading-snug">{item.description}</p>
                )}

                {/* Modifier radio group — only shown for items that have add-ons */}
                {item.modifiers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {[{ id: '', name: '不加料', price_delta: 0 }, ...item.modifiers].map(opt => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-1.5 text-xs text-cafe-text cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`mod-${item.id}`}
                          value={opt.id}
                          checked={(selectedModifiers[item.id] ?? '') === opt.id}
                          onChange={() =>
                            setSelectedModifiers(prev => ({ ...prev, [item.id]: opt.id }))
                          }
                          className="accent-cafe-bar"
                        />
                        <span>{opt.name}</span>
                        {opt.price_delta > 0 && (
                          <span className="ml-auto text-cafe-text/50">+${opt.price_delta}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-cafe-bar font-bold text-sm">${item.price}</span>
                  <div className="relative">
                    <button
                      onClick={() => {
                        const selId = selectedModifiers[item.id] ?? ''
                        const mod = item.modifiers.find(m => m.id === selId)
                        addItem({
                          menu_item_id: item.id,
                          name: item.name,
                          unit_price: item.price,
                          modifier: mod
                            ? { id: mod.id, name: mod.name, price_delta: Number(mod.price_delta) }
                            : undefined,
                        })
                      }}
                      className="bg-cafe-bar text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none hover:opacity-90 transition-opacity"
                      aria-label={`加入 ${item.name}`}
                    >
                      +
                    </button>
                    {qty > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold pointer-events-none">
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
    </div>
  )
}
