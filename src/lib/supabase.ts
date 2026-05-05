import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Server-side client — call inside Server Components and API Routes.
 * Lazy-imports next/headers so this file is safe to import in Client Components
 * (the server branch is never bundled client-side).
 */
export async function createSupabaseServerClient() {
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const store = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) => store.set(name, value, options)),
      },
    }
  )
}

/**
 * Browser client — call inside Client Components ('use client').
 * Safe for Realtime subscriptions and read-only queries.
 * All writes must go through API routes.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
