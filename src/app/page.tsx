import { getMenu } from '@/lib/getMenu'
import MenuGrid from '@/components/MenuGrid'
import CartPanel from '@/components/CartPanel'
import RefreshButton from '@/components/RefreshButton'

export default async function Home() {
  const menu = await getMenu()

  return (
    <div className="h-screen bg-cafe-bg text-cafe-text flex flex-col overflow-hidden">
      <header className="bg-cafe-bar text-white px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <span className="font-semibold text-lg">烹飪社 x 雄友會</span>
        <span className="text-sm opacity-75">點餐系統</span>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Menu — fills full width on mobile, 60% on desktop */}
        <section className="flex-1 overflow-y-auto min-h-0">
          <MenuGrid menu={menu} />
        </section>

        {/* Cart panel — fixed height on mobile, 40% on desktop */}
        <aside className="h-72 md:h-auto md:w-[40%] shrink-0 flex flex-col overflow-hidden bg-cafe-panel border-t md:border-t-0 md:border-l border-cafe-border">
          <CartPanel />
        </aside>
      </main>
    </div>
  )
}
