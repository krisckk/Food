'use client'

import { useState, useEffect } from 'react'
import { getMenu, type MenuByCategory } from '@/lib/getMenu'
import MenuGrid from '@/components/MenuGrid'
import CartPanel from '@/components/CartPanel'

export default function Home() {
  const [menu, setMenu] = useState<MenuByCategory>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMenu().then(data => {
      setMenu(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="h-screen bg-cafe-bg text-cafe-text flex items-center justify-center">
        <div className="animate-pulse">加載中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-cafe-bg text-cafe-text flex flex-col overflow-hidden">
      <header className="bg-cafe-bar text-white px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <span className="font-semibold text-lg">烹飪社 x 雄友會</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
          >
            刷新狀態
          </button>
          <span className="text-sm opacity-75">點餐系統</span>
        </div>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto min-h-0">
          <MenuGrid menu={menu} />
        </section>

        <aside className="h-72 md:h-auto md:w-[40%] shrink-0 flex flex-col overflow-hidden bg-cafe-panel border-t md:border-t-0 md:border-l border-cafe-border">
          <CartPanel />
        </aside>
      </main>
    </div>
  )
}
