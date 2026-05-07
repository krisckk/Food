'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, cartItemKey } from '@/context/CartContext'
import type { CartItem } from '@/context/CartContext'

type LastOrder = {
  orderId: string
  items: CartItem[]
  total: number
}

export default function CartPanel() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCheckout() {
    if (!customerName.trim()) {
      setError('請輸入姓名')
      return
    }
    if (items.length === 0) {
      setError('購物車是空的')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          items: items.map(i => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            modifier_id: i.modifier?.id ?? null,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '訂單失敗，請重試')
      }

      const { order } = await res.json() as { order: { id: string } }

      const orderRecord: LastOrder = { orderId: order.id, items: [...items], total }
      localStorage.setItem('lastOrder', JSON.stringify(orderRecord))
      clearCart()
      router.push(`/order/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '訂單失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-8 gap-3">
            <p className="text-cafe-text/50 text-sm">購物車是空的</p>
          </div>
        ) : (
          items.map(item => {
            const key = cartItemKey(item)
            const linePrice = (item.unit_price + (item.modifier?.price_delta ?? 0)) * item.quantity
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-cafe-text leading-snug truncate block">
                    {item.name}
                  </span>
                  {item.customization_note && (
                    <span className="text-cafe-text/50 text-xs block">{item.customization_note}</span>
                  )}
                  {item.modifier && (
                    <span className="text-cafe-text/50 text-xs">+ {item.modifier.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="w-9 h-9 rounded-full border border-cafe-bar text-cafe-bar flex items-center justify-center text-base leading-none hover:bg-cafe-bar hover:text-white transition-colors"
                    aria-label="減少數量"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-cafe-text font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    className="w-9 h-9 rounded-full border border-cafe-bar text-cafe-bar flex items-center justify-center text-base leading-none hover:bg-cafe-bar hover:text-white transition-colors"
                    aria-label="增加數量"
                  >
                    +
                  </button>
                </div>
                <span className="w-12 text-right text-cafe-bar font-medium tabular-nums shrink-0">
                  ${linePrice}
                </span>
                <button
                  onClick={() => removeItem(key)}
                  className="text-cafe-text/40 hover:text-red-500 transition-colors shrink-0 w-9 h-9 -mr-2 flex items-center justify-center text-lg"
                  aria-label={`移除 ${item.name}`}
                >
                  ×
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-cafe-border px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-3 shrink-0">
        <input
          type="text"
          placeholder="顧客姓名（必填）"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="w-full border border-cafe-border rounded-md px-3 py-2 text-sm bg-cafe-card text-cafe-text placeholder:text-cafe-text/40 focus:outline-none focus:ring-2 focus:ring-cafe-bar"
        />
        <div className="flex items-center justify-between">
          <span className="text-cafe-text font-medium text-sm">總計</span>
          <span className="text-cafe-bar font-bold tabular-nums">${total}</span>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          onClick={handleCheckout}
          disabled={loading || items.length === 0}
          className="w-full bg-cafe-bar text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '處理中...' : '結帳'}
        </button>
      </div>
    </div>
  )
}
