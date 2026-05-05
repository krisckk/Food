import { NextResponse } from 'next/server'
import { getMenu } from '@/lib/getMenu'

export async function GET() {
  try {
    const grouped = await getMenu()
    return NextResponse.json(grouped)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DB error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
