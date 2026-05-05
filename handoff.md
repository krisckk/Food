# Handoff Note — feat/frontend

## What was built

Branch `feat/frontend` is **complete and verified** (typecheck clean, lint clean, 8/8 tests pass).
Branches in repo: `main` (API routes merged), `feat/frontend` (this session).

### Files created / modified

| File | Action |
|------|--------|
| `supabase/seed.sql` | Replaced with 28 real menu items across 4 categories |
| `src/lib/getMenu.ts` | New server helper — shared by API route and page Server Component |
| `src/app/api/menu/route.ts` | Refactored to delegate to `getMenu()` |
| `tailwind.config.ts` | Added café color palette (cafe-bg, cafe-bar, cafe-card, etc.) |
| `src/context/CartContext.tsx` | Cart state with localStorage persistence |
| `src/app/layout.tsx` | Wraps children with `<CartProvider>`, updated metadata |
| `src/components/MenuGrid.tsx` | Category tabs + 2-column food card grid |
| `src/components/CartPanel.tsx` | 未送單/已送單 tabs, qty controls, checkout flow |
| `src/app/page.tsx` | Full menu page (server component, 60/40 layout) |
| `src/app/order/[id]/page.tsx` | Order confirmation page |
| `next.config.mjs` | Added HTTPS remote image patterns |
| `src/app/(menu)/page.tsx` | Deleted (conflicted with root page) |
| `src/app/(checkout)/page.tsx` | Deleted (conflicted with root page) |

### Seed data — 4 categories, 28 items
- **烤物**: 海苔飯卷×3, 熱壓吐司×2, 台式肉燥飯, 加滷蛋 (+add-on), 加滷豆乾 (+add-on)
- **創新**: 13 dessert items incl. variants (巴斯克蛋糕原味/巧克力, 曲奇原味/巧克力)
- **冰物**: 雪花冰, +布丁 add-on, 愛玉冬瓜檸檬, +手搓愛玉 add-on, 仙草, 芋頭西米露
- **烹飪社x雄友會**: 費南雪

### Checkout flow
1. User adds items from MenuGrid → CartContext updates + localStorage syncs
2. CartPanel 未送單 tab: enter name → 結帳
3. POST /api/orders → on success: save `lastOrder` to localStorage → `clearCart()` → `router.push('/order/[id]')`
4. `/order/[id]` reads `lastOrder` from localStorage → shows 訂單已送出！🎉

## Status

| Item | Status |
|------|--------|
| Seed data (28 items) | Done |
| getMenu() server helper | Done |
| CartContext + localStorage | Done |
| MenuGrid (tabs + cards) | Done |
| CartPanel (checkout) | Done |
| Root page (60/40 layout) | Done |
| Order confirmation page | Done |
| typecheck | 0 errors |
| lint | 0 warnings |
| Tests (8/8) | Pass |
| Notion sync implementation | **Not done** — stub throws |

## Exact next step

Implement `syncOrderToNotion` in `src/lib/notion.ts` using the Notion MCP.

```ts
export async function syncOrderToNotion(order: Order, items: OrderItem[]): Promise<string>
// Returns the Notion page ID. Throws on failure (caller handles gracefully).
```

Fields: Order ID, Customer Name, Items (multi-select), Total, Status (`Pending`), Timestamp.
Env vars: `NOTION_API_TOKEN`, `NOTION_ORDERS_DATABASE_ID`.

## Decisions made

- **`getMenu()` helper** — avoids relative `fetch('/api/menu')` in Server Components (problematic without a base URL at build time). Both the API route and the page call it directly.
- **CartProvider in layout** — standard Next.js pattern: Server Component layout renders a `'use client'` component as a children wrapper without making the layout itself a client component.
- **Add-ons as separate menu items** — fits existing schema; description field says "請搭配主餐加購" as a semantic hint. Known trade-off for the prototype.
- **localStorage-only confirmation page** — avoids creating a new `GET /api/orders/[id]` route (and test). Known limitation: breaks on refresh or new device. Future improvement: add the GET route.
- **Responsive layout** — on mobile the panels stack (`flex-col`), cart panel is `h-72` fixed; on desktop (`md:flex-row`) they split 60/40 filling full viewport height.

## Gotchas

- Deleting `(menu)/page.tsx` and `(checkout)/page.tsx` was required — Next.js App Router treats `()` route groups as transparent, so both served `/` and conflicted with `src/app/page.tsx`.
- `clearCart()` is called in the order confirmation page's `useEffect` as belt-and-suspenders cleanup (primary clear happens in CartPanel before `router.push`).
- The `lastOrder` localStorage key stores items + total for display on the confirmation page and the 已送單 tab.
