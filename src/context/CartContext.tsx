'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

export type CartItem = {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number
}

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items
    case 'ADD': {
      const existing = state.find(i => i.menu_item_id === action.item.menu_item_id)
      if (existing) {
        return state.map(i =>
          i.menu_item_id === action.item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...state, { ...action.item, quantity: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i.menu_item_id !== action.id)
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => i.menu_item_id !== action.id)
      return state.map(i =>
        i.menu_item_id === action.id ? { ...i, quantity: action.qty } : i
      )
    case 'CLEAR':
      return []
  }
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menu_item_id: string) => void
  updateQuantity: (menu_item_id: string, qty: number) => void
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

  // dispatch from useReducer is stable — useCallback deps can be empty
  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) =>
    dispatch({ type: 'ADD', item }), [])
  const removeItem = useCallback((id: string) =>
    dispatch({ type: 'REMOVE', id }), [])
  const updateQuantity = useCallback((id: string, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', id, qty }), [])
  const clearCart = useCallback(() =>
    dispatch({ type: 'CLEAR' }), [])

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

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
