// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/supabase', () => ({
  createSupabaseAdminClient: vi.fn(),
}))

import { createSupabaseAdminClient } from '@/lib/supabase'

function makeSupabaseMock() {
  const eqMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn().mockReturnValue({
    eq: eqMock,
  })
  return {
    from: vi.fn().mockReturnValue({
      update: updateMock,
    }),
    _updateMock: updateMock,
    _eqMock: eqMock,
  }
}

function makeRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/notion/webhook', () => {
  it('updates Supabase when Order ID and Status are present', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const payload = {
      properties: {
        'Order ID': {
          title: [{ text: { content: 'order-123' } }],
        },
        'Status': {
          select: { name: '已做完' },
        },
      },
    }

    const res = await POST(makeRequest(payload))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.status).toBe('已做完')
    expect(mock._updateMock).toHaveBeenCalledWith({ status: '已做完' })
  })

  it('handles nested payload format (data wrapper)', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const payload = {
      data: {
        properties: {
          'Order ID': {
            title: [{ text: { content: 'order-456' } }],
          },
          'Status': {
            status: { name: '已付款' },
          },
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('已付款')
    expect(mock._updateMock).toHaveBeenCalledWith({ status: '已付款' })
  })

  it('returns 400 if Order ID is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(createSupabaseAdminClient).mockImplementation(() => {
      throw new Error('Supabase error')
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const payload = {
      properties: {
        'Order ID': {
          title: [{ text: { content: 'order-789' } }],
        },
        'Status': {
          select: { name: '已做完' },
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
