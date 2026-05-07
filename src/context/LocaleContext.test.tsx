// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LocaleProvider, useLocale, translate } from './LocaleContext'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('translate()', () => {
  it('returns zh-TW string for zh-TW locale', () => {
    expect(translate('zh-TW', 'cart.empty')).toBe('購物車是空的')
  })

  it('returns English string for en locale', () => {
    expect(translate('en', 'cart.empty')).toBe('Your cart is empty')
  })

  it('interpolates {name} in zh-TW', () => {
    expect(translate('zh-TW', 'cart.removeItem', { name: '蛋糕' })).toBe('移除 蛋糕')
  })

  it('interpolates {name} in en', () => {
    expect(translate('en', 'cart.removeItem', { name: 'Cake' })).toBe('Remove Cake')
  })

  it('returns the key string for an unknown key', () => {
    // Casting to bypass TypeScript to test runtime fallback
    expect(translate('en', 'cart.doesNotExist' as never)).toBe('cart.doesNotExist')
  })
})

describe('LocaleProvider + useLocale()', () => {
  it('defaults to zh-TW locale', () => {
    const { result } = renderHook(() => useLocale(), { wrapper })
    expect(result.current.locale).toBe('zh-TW')
  })

  it('setLocale updates locale and writes to localStorage', () => {
    const { result } = renderHook(() => useLocale(), { wrapper })
    act(() => {
      result.current.setLocale('en')
    })
    expect(result.current.locale).toBe('en')
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('hydrates locale from localStorage on mount', () => {
    localStorage.setItem('locale', 'en')
    const { result } = renderHook(() => useLocale(), { wrapper })
    // After the effect fires, locale should hydrate to 'en'
    act(() => {})
    expect(result.current.locale).toBe('en')
  })

  it('t() returns zh-TW string in default locale', () => {
    const { result } = renderHook(() => useLocale(), { wrapper })
    expect(result.current.t('order.total')).toBe('總計')
  })

  it('t() returns English string after switching to en', () => {
    const { result } = renderHook(() => useLocale(), { wrapper })
    act(() => {
      result.current.setLocale('en')
    })
    expect(result.current.t('order.total')).toBe('Total')
  })

  it('t() interpolates variables', () => {
    const { result } = renderHook(() => useLocale(), { wrapper })
    act(() => {
      result.current.setLocale('en')
    })
    expect(result.current.t('cart.itemCount', { count: 3 })).toBe('3 items')
  })
})
