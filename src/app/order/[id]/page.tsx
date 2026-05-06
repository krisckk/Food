'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart, cartItemKey } from '@/context/CartContext'
import type { CartItem } from '@/context/CartContext'

type LastOrder = {
  orderId: string
  items: CartItem[]
  total: number
}

export default function OrderConfirmation({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<LastOrder | null>(null)
  const [status, setStatus] = useState<string>('已點餐')
  const { clearCart } = useCart()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastOrder')
      if (stored) setOrder(JSON.parse(stored) as LastOrder)
    } catch {
      // ignore
    }
    clearCart()
  }, [clearCart])

  // Automatic background sync every 10 seconds
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch(`/api/notion/webhook?orderId=${params.id}`)
        const data = await res.json()
        if (data.status) setStatus(data.status)
      } catch (err) {
        console.error('Auto-sync failed', err)
      }
    }

    sync() // Immediate sync on load
    const interval = setInterval(sync, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [params.id])

  return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-4">
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-block bg-cafe-bar/10 text-cafe-bar px-3 py-1 rounded-full text-xs font-bold mb-4">
            狀態：{status}
          </div>
          <h1 className="text-2xl font-bold text-cafe-text">訂單已送出！🎉</h1>
          <p className="text-cafe-text/60 text-sm mt-2">訂單編號 #{params.id.slice(0, 8)}</p>
        </div>

        {order && (
          <div className="space-y-2 border-t border-cafe-border pt-4">
            {order.items.map(item => {
              const linePrice = (item.unit_price + (item.modifier?.price_delta ?? 0)) * item.quantity
              return (
                <div key={cartItemKey(item)} className="flex justify-between text-sm text-cafe-text">
                  <div className="min-w-0 mr-2">
                    <span className="truncate block">{item.name} ×{item.quantity}</span>
                    {item.customization_note && (
                      <span className="text-cafe-text/50 text-xs block">{item.customization_note}</span>
                    )}
                    {item.modifier && (
                      <span className="text-cafe-text/50 text-xs">+ {item.modifier.name}</span>
                    )}
                  </div>
                  <span className="text-cafe-bar font-medium tabular-nums shrink-0">
                    ${linePrice}
                  </span>
                </div>
              )
            })}
            <div className="flex justify-between font-bold text-cafe-text border-t border-cafe-border pt-2 mt-2">
              <span>總計</span>
              <span className="text-cafe-bar tabular-nums">${order.total}</span>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Link
            href="/"
            className="block w-full bg-cafe-bar text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity text-center"
          >
            回到選單
          </Link>
        </div>

        <p className="text-[10px] text-center text-cafe-text/40">
          * 系統將自動同步 Notion 準備狀態，請耐心候餐
        </p>
      </div>
    </div>
  )
}
