# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Model Assignment Rules

See `.claude/rules/model_assignment.md` for the full rule set. Summary:

| Role | Model | When |
| :--- | :--- | :--- |
| Team Lead | Opus | Coordination, synthesis, complex decomposition |
| Teammate (default) | Sonnet | Standard implementation tasks |
| Teammate (escalated) | Opus | Complex architecture, security-critical, performance-sensitive |
| Subagent (read-only) | Haiku | File search, codebase exploration, quick research |
| Subagent (code changes) | Sonnet or Opus | Implementation or refactoring |

## Project
Food ordering web app. Customers browse a menu, place orders,
and orders are persisted to Supabase. A Notion page mirrors
order data via the Notion MCP for kitchen/ops visibility.

Stack: Next.js 14 (App Router), TypeScript strict, Tailwind CSS,
Supabase (Postgres + Realtime), Notion MCP integration.

## Common commands
- npm run dev          # start dev server (localhost:3000)
- npm run build        # production build — run before every PR
- npm run lint         # ESLint check
- npm run typecheck    # tsc --noEmit
- npm run test         # vitest (all tests)
- npx vitest run src/path/to/test.test.ts  # single test file

## Project structure
src/
  app/               # Next.js App Router pages & layouts
    (menu)/          # menu browsing route group
    (checkout)/      # cart & order flow route group
    api/             # API route handlers
  components/        # shared UI components
  lib/
    supabase.ts      # Supabase client (server + browser)
    notion.ts        # Notion MCP helpers
    types.ts         # shared TypeScript types
  hooks/             # custom React hooks
supabase/
  migrations/        # SQL migration files — NEVER edit directly
  seed.sql           # dev seed data

## Constraints (hard rules — not suggestions)
- MUST use TypeScript strict mode — never use `any`, use `unknown` and narrow it
- MUST create a feature branch before starting any task
- MUST run `npm run typecheck && npm run lint` before committing
- MUST write at least one test for every API route handler
- MUST NOT commit .env or .env.local — use .env.example instead
- MUST NOT expose Supabase service role key on the client side
- NEVER modify files in supabase/migrations/ directly
- NEVER push directly to main

## Supabase rules
- Use server-side Supabase client in API routes & Server Components
- Use browser client only in Client Components (marked 'use client')
- All DB writes go through API routes — never call Supabase directly
  from Client Components
- Enable Row Level Security (RLS) on every table
- New tables: always create a migration via
  `npx supabase migration new <name>`, never raw ALTER TABLE

## Notion MCP rules
- All Notion syncs happen server-side only (API routes)
- On every new order: write a new Notion page to the Orders database
- Notion page fields: Order ID, Customer Name, Items (multi-select),
  Total, Status (select: Pending / Preparing / Done), Timestamp
- NEVER expose Notion API token to the browser
- If Notion sync fails, log the error but do NOT block the order —
  Supabase is the source of truth

## Data flow
Customer places order
  → POST /api/orders (validates, writes to Supabase)
  → Supabase insert succeeds
  → Server calls Notion MCP to create order page
  → Returns order confirmation to client

## Environment variables (define in .env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never NEXT_PUBLIC_
NOTION_API_TOKEN=               # server only, never NEXT_PUBLIC_
NOTION_ORDERS_DATABASE_ID=      # server only, never NEXT_PUBLIC_

## What Claude gets wrong (fix these)
- Do NOT import the service role Supabase client in any file
  inside src/app that is not an API route
- Do NOT use `router.push` after form submit without clearing
  cart state first
- Do NOT create new migration files manually — always use the
  Supabase CLI command above
- Do NOT add barrel exports (index.ts) — causes circular deps
  in Next.js App Router

## Git workflow
- Branch naming: feat/, fix/, chore/
- One commit per logical change — not per file
- PR description must include: what changed, how to test it,
  any env vars added