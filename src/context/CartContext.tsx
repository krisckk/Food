'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

export type CartItemModifier = {
  id: string
  name: string
  price_delta: number
}

export type CartItem = {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number          // base price only
  modifier?: CartItemModifier
  customization_note?: string // e.g. "牛奶 / 湯圓" — informational, no price impact
}

export function cartItemKey(item: Pick<CartItem, 'menu_item_id' | 'modifier' | 'customization_note'>): string {
  const parts: string[] = [item.menu_item_id]
  if (item.modifier) parts.push(item.modifier.id)
  if (item.customization_note) parts.push(item.customization_note)
  return parts.join('__')
}

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; key: string }
  | { type: 'UPDATE_QTY'; key: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items
    case 'ADD': {
      const key = cartItemKey(action.item)
      const existing = state.find(i => cartItemKey(i) === key)
      if (existing) {
        return state.map(i =>
          cartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...state, { ...action.item, quantity: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => cartItemKey(i) !== action.key)
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => cartItemKey(i) !== action.key)
      return state.map(i =>
        cartItemKey(i) === action.key ? { ...i, quantity: action.qty } : i
      )
    case 'CLEAR':
      return []
  }
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, qty: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) dispatch({ type: 'HYDRATE', items: JSON.parse(stored) as CartItem[] })
    } catch {
      // ignore malformed localStorage
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) =>
    dispatch({ type: 'ADD', item }), [])
  const removeItem = useCallback((key: string) =>
    dispatch({ type: 'REMOVE', key }), [])
  const updateQuantity = useCallback((key: string, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', key, qty }), [])
  const clearCart = useCallback(() =>
    dispatch({ type: 'CLEAR' }), [])

  const total = items.reduce(
    (sum, i) => sum + (i.unit_price + (i.modifier?.price_delta ?? 0)) * i.quantity,
    0
  )

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, total }),
    [items, addItem, removeItem, updateQuantity, clearCart, total],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
