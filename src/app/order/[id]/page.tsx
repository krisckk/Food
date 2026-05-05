'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import type { CartItem } from '@/context/CartContext'

type LastOrder = {
  orderId: string
  items: CartItem[]
  total: number
}

export default function OrderConfirmation({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<LastOrder | null>(null)
  const { clearCart } = useCart()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastOrder')
      if (stored) setOrder(JSON.parse(stored) as LastOrder)
    } catch {
      // ignore malformed localStorage
    }
    clearCart()
  }, [clearCart])

  return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-4">
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cafe-text">訂單已送出！🎉</h1>
          <p className="text-cafe-text/60 text-sm mt-2">訂單編號 #{params.id.slice(0, 8)}</p>
        </div>

        {order && (
          <div className="space-y-2 border-t border-cafe-border pt-4">
            {order.items.map(item => (
              <div key={item.menu_item_id} className="flex justify-between text-sm text-cafe-text">
                <span className="min-w-0 truncate mr-2">
                  {item.name} ×{item.quantity}
                </span>
                <span className="text-cafe-bar font-medium tabular-nums shrink-0">
                  ${item.unit_price * item.quantity}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-cafe-text border-t border-cafe-border pt-2 mt-2">
              <span>總計</span>
              <span className="text-cafe-bar tabular-nums">${order.total}</span>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="block w-full bg-cafe-bar text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity text-center"
        >
          回到選單
        </Link>
      </div>
    </div>
  )
}
