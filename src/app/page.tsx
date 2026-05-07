import { getMenu } from '@/lib/getMenu'
import MenuGrid from '@/components/MenuGrid'
import CartPanel from '@/components/CartPanel'
import MobileCartSheet from '@/components/MobileCartSheet'

export default async function Home() {
  const menu = await getMenu()

  return (
    <div className="h-screen bg-cafe-bg text-cafe-text flex flex-col overflow-hidden">
      <header className="bg-cafe-bar text-white px-4 py-2 flex items-center justify-center shrink-0 z-20">
        <span className="font-semibold text-lg">烹飪社 x 雄友會</span>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto min-h-0">
          <MenuGrid menu={menu} />
        </section>

        <aside className="hidden md:flex md:w-[40%] shrink-0 flex-col overflow-hidden bg-cafe-panel border-l border-cafe-border">
          <CartPanel />
        </aside>
      </main>

      <MobileCartSheet />
    </div>
  )
}
