# Handoff Note — feat/api-routes

## What was built

Branch `feat/api-routes` is **complete and verified** (typecheck, lint, tests all pass).

### Files created / modified

| File | Action |
|------|--------|
| `src/lib/supabase.ts` | Added `createSupabaseAdminClient()` (service-role, top-level ES import) |
| `src/lib/notion.ts` | Typed stub — always throws; ready to implement |
| `src/app/api/menu/route.ts` | GET /api/menu — returns available items grouped by category |
| `src/app/api/menu/route.test.ts` | 3 tests: 200 grouped, 500 on DB error, empty object |
| `src/app/api/orders/route.ts` | POST /api/orders — full order creation flow |
| `src/app/api/orders/route.test.ts` | 5 tests (see below) |
| `vitest.config.ts` | Added `@` alias + `passWithNoTests: true` |

### POST /api/orders flow
1. Zod validation → 400 on invalid body
2. Fetch + validate menu item prices server-side → 422 if unavailable
3. Calculate total server-side
4. Insert `orders` row (admin client, bypasses RLS)
5. Insert `order_items` — compensating delete + 500 if this fails
6. Notion sync in try/catch — logs error, never blocks → returns 200 either way
7. Return `{ order: { ...order, notion_page_id } }` — merges ID so caller doesn't need a re-fetch

### Tests (8/8 pass)
- menu: 200 grouped by category, 500 on DB error, empty object when no items
- orders: happy path (200 + notion_page_id set), Notion failure (200 + notion_page_id null), order_items failure (500 + compensating delete), 400 invalid body, 422 unavailable item

## Status

| Item | Status |
|------|--------|
| GET /api/menu | Done |
| POST /api/orders | Done |
| Tests | Done (8/8) |
| typecheck | 0 errors |
| lint | 0 warnings |
| Notion sync implementation | **Not done** — stub throws |
| Menu browsing UI | Not started |
| Checkout/cart UI | Not started |

## Exact next step

Implement `syncOrderToNotion` in `src/lib/notion.ts` using the Notion MCP.

The function signature is already typed:
```ts
export async function syncOrderToNotion(order: Order, items: OrderItem[]): Promise<string>
// Returns the Notion page ID. Throws on failure.
```

Notion page fields (from CLAUDE.md): Order ID, Customer Name, Items (multi-select), Total, Status (select: Pending/Preparing/Done), Timestamp.

Env vars needed: `NOTION_API_TOKEN`, `NOTION_ORDERS_DATABASE_ID` (add to `.env.local`).

## Decisions and why

- **Top-level ES import for admin client** — `require()` inside TypeScript is awkward; top-level import is fine because `@supabase/supabase-js` has no `next/headers` dependency.
- **Notion failure → 200 not 500** — Supabase is source of truth; Notion is ops convenience. A Notion outage must not block customers placing orders.
- **Compensating delete** — no Postgres transaction across two ORM calls; app-level compensating delete keeps DB consistent if `order_items` insert fails.
- **Merge `notion_page_id` into response** — avoids a round-trip re-fetch while keeping the DB as source of truth.

## Gotchas discovered

- **Zod v4 strict UUID** — version nibble must be 1-8, variant nibble must be 8/9/a/b. Test UUID `'550e8400-e29b-41d4-a716-446655440000'` is valid; `'00000000-0000-0000-0000-000000000001'` is not (version nibble = 0).
- **PowerShell UTF-16 LE** — `>` redirect writes UTF-16 LE; `types.ts` generated this way was flagged as binary by ESLint. Re-encoded with `[System.IO.File]::WriteAllText(...)`.
- **API route tests need `// @vitest-environment node`** — jsdom (the default) breaks `NextResponse`.
- **Next.js package names must be lowercase** — scaffolded in `food-bootstrap`, copied to `Food` with robocopy.
