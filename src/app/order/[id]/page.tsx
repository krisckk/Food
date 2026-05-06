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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle')
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

  const triggerSync = async () => {
    setSyncStatus('syncing')
    try {
      await fetch(`/api/notion/webhook?orderId=${params.id}`)
      setSyncStatus('done')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (err) {
      console.error('Sync failed', err)
      setSyncStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-4">
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
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

        <div className="pt-4 space-y-3">
          <button
            onClick={triggerSync}
            disabled={syncStatus === 'syncing'}
            className="w-full bg-white border border-cafe-bar text-cafe-bar py-2 rounded-lg font-medium text-sm hover:bg-cafe-bar/5 transition-colors disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? '同步中...' : syncStatus === 'done' ? '✅ 狀態已同步' : '🔄 點此整理 Notion 狀態'}
          </button>
          
          <Link
            href="/"
            className="block w-full bg-cafe-bar text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity text-center"
          >
            回到選單
          </Link>
        </div>

        <p className="text-[10px] text-center text-cafe-text/40">
          * 提示：若 Notion 狀態未自動更新，請點擊上方按鈕
        </p>
      </div>
    </div>
  )
}
