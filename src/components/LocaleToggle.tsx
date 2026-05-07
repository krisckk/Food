'use client'

import { useLocale } from '@/context/LocaleContext'

export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale()
  const isEn = locale === 'en'

  return (
    <button
      type="button"
      onClick={() => setLocale(isEn ? 'zh-TW' : 'en')}
      aria-label={isEn ? t('toggle.switchToChinese') : t('toggle.switchToEnglish')}
      aria-pressed={isEn}
      className="text-xs font-medium px-2 py-1 rounded border border-white/40 text-white/90 hover:bg-white/20 transition-colors w-16 text-center"
    >
      {isEn ? '中文' : 'EN'}
    </button>
  )
}
