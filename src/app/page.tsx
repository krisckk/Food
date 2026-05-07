import { getMenu } from '@/lib/getMenu'
import MenuGrid from '@/components/MenuGrid'
import CartPanel from '@/components/CartPanel'
import MobileCartSheet from '@/components/MobileCartSheet'
import LocaleToggle from '@/components/LocaleToggle'

export const revalidate = 60

export default async function Home() {
  const menu = await getMenu()

  return (
    <div className="h-screen bg-cafe-bg text-cafe-text flex flex-col overflow-hidden">
      <header className="bg-cafe-bar text-white px-4 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="w-16" aria-hidden />
        <span className="font-semibold text-lg">雄友會</span>
        <LocaleToggle />
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
