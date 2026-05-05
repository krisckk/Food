'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import type { CartItem } from '@/context/CartContext'

type LastOrder = {
  orderId: string
  items: CartItem[]
  total: number
}

export default function CartPanel() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const [tab, setTab] = useState<'pending' | 'sent'>('pending')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastOrder')
      if (stored) setLastOrder(JSON.parse(stored) as LastOrder)
    } catch {
      // ignore malformed localStorage
    }
  }, [])

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
          items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '訂單失敗，請重試')
      }

      const { order } = await res.json() as { order: { id: string } }

      const orderRecord: LastOrder = { orderId: order.id, items: [...items], total }
      localStorage.setItem('lastOrder', JSON.stringify(orderRecord))
      setLastOrder(orderRecord)
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
      {/* Tabs */}
      <div className="flex border-b border-cafe-border shrink-0">
        {(['pending', 'sent'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-cafe-bar text-white'
                : 'text-cafe-text hover:bg-cafe-border'
            }`}
          >
            {t === 'pending' ? '未送單' : '已送單'}
          </button>
        ))}
      </div>

      {tab === 'pending' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {items.length === 0 ? (
              <p className="text-cafe-text/50 text-sm text-center pt-8">購物車是空的</p>
            ) : (
              items.map(item => (
                <div key={item.menu_item_id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-cafe-text leading-snug min-w-0 truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border border-cafe-bar text-cafe-bar flex items-center justify-center text-xs leading-none hover:bg-cafe-bar hover:text-white transition-colors"
                      aria-label="減少數量"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-cafe-text font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border border-cafe-bar text-cafe-bar flex items-center justify-center text-xs leading-none hover:bg-cafe-bar hover:text-white transition-colors"
                      aria-label="增加數量"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-12 text-right text-cafe-bar font-medium tabular-nums shrink-0">
                    ${item.unit_price * item.quantity}
                  </span>
                  <button
                    onClick={() => removeItem(item.menu_item_id)}
                    className="text-cafe-text/40 hover:text-red-500 transition-colors w-4 text-center shrink-0"
                    aria-label={`移除 ${item.name}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout footer */}
          <div className="border-t border-cafe-border p-3 space-y-3 shrink-0">
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
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {lastOrder ? (
            <div className="space-y-3">
              <p className="text-cafe-text/60 text-xs font-medium">
                訂單 #{lastOrder.orderId.slice(0, 8)}
              </p>
              <div className="space-y-2">
                {lastOrder.items.map(item => (
                  <div
                    key={item.menu_item_id}
                    className="flex justify-between text-sm text-cafe-text"
                  >
                    <span className="min-w-0 truncate mr-2">
                      {item.name} ×{item.quantity}
                    </span>
                    <span className="text-cafe-bar font-medium tabular-nums shrink-0">
                      ${item.unit_price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cafe-border pt-2 flex justify-between font-bold text-cafe-text">
                <span>總計</span>
                <span className="text-cafe-bar tabular-nums">${lastOrder.total}</span>
              </div>
            </div>
          ) : (
            <p className="text-cafe-text/50 text-sm text-center pt-8">尚無已送出的訂單</p>
          )}
        </div>
      )}
    </div>
  )
}
