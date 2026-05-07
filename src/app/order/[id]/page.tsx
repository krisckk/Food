'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart, cartItemKey } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import type { TranslationKey } from '@/context/LocaleContext'
import type { CartItem } from '@/context/CartContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import SyncEngine from '@/components/SyncEngine'

type LastOrder = {
  orderId: string
  items: CartItem[]
  total: number
}

const STATUS_KEY_MAP: Record<string, TranslationKey> = {
  '已點餐': 'status.placed',
  '已付款': 'status.paid',
  '已做完': 'status.done',
  '已送達': 'status.delivered',
  'Done':   'status.completed',
}

export default function OrderConfirmation({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<LastOrder | null>(null)
  const [status, setStatus] = useState<string>('已點餐')
  const { clearCart } = useCart()
  const { t } = useLocale()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastOrder')
      if (stored) setOrder(JSON.parse(stored) as LastOrder)
    } catch {
      // ignore
    }
    clearCart()
  }, [clearCart])

  // Initial fetch + Supabase Realtime for instant status updates
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then((d: { status?: string }) => {
        if (d.status) setStatus(d.status)
      })
      .catch(() => {})

    const channel = supabase
      .channel(`order-${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` },
        (payload) => {
          const next = (payload.new as { status?: string }).status
          if (next) setStatus(next)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id])

  function displayStatus(raw: string): string {
    const key = STATUS_KEY_MAP[raw]
    return key ? t(key) : raw
  }

  const statusTone =
    status === 'Done' || status === '已送達'
      ? 'bg-green-100 text-green-700'
      : status === '已做完'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-cafe-bar/10 text-cafe-bar'

  return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-4">
      <SyncEngine />
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-6 max-w-md w-full space-y-5">
        <div className="text-center">
          <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${statusTone}`}>
            {t('order.statusLabel')}：{displayStatus(status)}
          </div>
          <h1 className="text-2xl font-bold text-cafe-text">{t('order.submitted')}</h1>
          <p className="text-cafe-text/60 text-sm mt-2">{t('order.orderNumber', { id: params.id.slice(0, 8) })}</p>
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
              <span>{t('order.total')}</span>
              <span className="text-cafe-bar tabular-nums">${order.total}</span>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Link
            href="/"
            className="block w-full bg-cafe-bar text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity text-center"
          >
            {t('order.backToMenu')}
          </Link>
        </div>

        <p className="text-[10px] text-center text-cafe-text/40">
          {t('order.syncDisclaimer')}
        </p>
      </div>
    </div>
  )
}
