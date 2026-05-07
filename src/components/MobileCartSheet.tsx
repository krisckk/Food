'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import CartPanel from './CartPanel'

export default function MobileCartSheet() {
  const [open, setOpen] = useState(false)
  const { items, total } = useCart()
  const { t } = useLocale()
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden w-full shrink-0 bg-cafe-bar text-white flex items-center justify-between px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_14px_rgba(0,0,0,0.12)] active:opacity-90"
        aria-label={t('cart.openCart', { count: itemCount, total })}
      >
        <span className="flex items-center gap-3">
          <span className="relative inline-flex w-7 h-7 items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </span>
          <span className="font-medium text-sm">
            {itemCount === 0 ? t('cart.empty') : t('cart.itemCount', { count: itemCount })}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-bold tabular-nums text-base">${total}</span>
          <span className="bg-white/20 rounded-full px-3 py-1.5 text-xs font-medium">{t('cart.viewCart')}</span>
        </span>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('cart.cartTitle')}
            className="absolute inset-x-0 bottom-0 top-14 bg-cafe-panel rounded-t-2xl flex flex-col overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-cafe-border shrink-0">
              <span className="font-medium text-cafe-text">{t('cart.cartTitle')}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={t('cart.closeCart')}
                className="w-10 h-10 -mr-2 flex items-center justify-center text-cafe-text/60 hover:text-cafe-text text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartPanel />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
