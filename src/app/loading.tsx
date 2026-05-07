export default function Loading() {
  return (
    <div className="h-screen bg-cafe-bg text-cafe-text flex flex-col overflow-hidden">
      <header className="bg-cafe-bar px-4 py-2 flex items-center justify-center shrink-0">
        <span className="font-semibold text-lg text-white">烹飪社 x 雄友會</span>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto min-h-0">
          {/* Category tab skeletons */}
          <div className="flex gap-1 px-3 py-2 border-b border-cafe-border">
            {[60, 48, 56].map(w => (
              <div key={w} className={`h-8 w-${w} rounded bg-cafe-border animate-pulse`} />
            ))}
          </div>

          {/* Card grid skeletons */}
          <div className="grid grid-cols-2 gap-3 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-cafe-card border border-cafe-border flex flex-col">
                <div className="aspect-[4/3] bg-cafe-border animate-pulse" />
                <div className="p-2 space-y-2">
                  <div className="h-3 bg-cafe-border rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-cafe-border rounded animate-pulse w-1/2" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-4 w-8 bg-cafe-border rounded animate-pulse" />
                    <div className="w-11 h-11 rounded-full bg-cafe-border animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
