// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { createSupabaseServerClient } from '@/lib/supabase'

const mockOrder = vi.fn()
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ from: mockFrom } as never)
})

describe('GET /api/menu', () => {
  it('returns 200 with items grouped by category', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { id: '1', name: 'Pizza', category: 'main', price: 12.99, available: true, description: null, image_url: null, created_at: '' },
        { id: '2', name: 'Salad', category: 'starter', price: 8.99, available: true, description: null, image_url: null, created_at: '' },
        { id: '3', name: 'Soup', category: 'starter', price: 6.99, available: true, description: null, image_url: null, created_at: '' },
      ],
      error: null,
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('main')
    expect(body).toHaveProperty('starter')
    expect(body.main).toHaveLength(1)
    expect(body.starter).toHaveLength(2)
  })

  it('returns 500 on database error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'connection refused' } })

    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('returns empty object when no available items', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })
})
