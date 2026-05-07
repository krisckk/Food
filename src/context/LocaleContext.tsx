'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import zhTW, { type Translations } from '@/lib/i18n/zh-TW'
import en from '@/lib/i18n/en'

export type Locale = 'zh-TW' | 'en'

type Leaves<T, P extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? P extends ''
      ? `${K & string}`
      : `${P}.${K & string}`
    : Leaves<T[K], P extends '' ? `${K & string}` : `${P}.${K & string}`>
}[keyof T]

export type TranslationKey = Leaves<Translations>

type Vars = Record<string, string | number>

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Vars) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'locale'

function isLocale(value: unknown): value is Locale {
  return value === 'zh-TW' || value === 'en'
}

export function resolveTranslation(dict: Translations, key: string): string {
  const parts = key.split('.')
  let node: unknown = dict
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof node === 'string' ? node : key
}

export function interpolate(template: string, vars: Vars): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  )
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Vars,
): string {
  const dict = locale === 'en' ? en : zhTW
  const raw = resolveTranslation(dict, key)
  return vars ? interpolate(raw, vars) : raw
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-TW')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) setLocaleState(stored)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-TW'
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Vars): string => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
