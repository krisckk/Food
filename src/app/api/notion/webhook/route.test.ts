// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/supabase', () => ({
  createSupabaseAdminClient: vi.fn(),
}))
vi.mock('@/lib/notion', () => ({
  updateSummaryStatus: vi.fn(),
}))

import { createSupabaseAdminClient } from '@/lib/supabase'
import { updateSummaryStatus } from '@/lib/notion'

function makeSupabaseMock() {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })
  return {
    from: vi.fn().mockReturnValue({
      update: updateMock,
    }),
    _updateMock: updateMock,
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
  it('updates summary and Supabase when Order ID is present', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)
    vi.mocked(updateSummaryStatus).mockResolvedValue('已做完')

    const payload = {
      properties: {
        'Order ID': {
          title: [{ text: { content: 'order-123' } }],
        },
      },
    }

    const res = await POST(makeRequest(payload))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.status).toBe('已做完')
    expect(updateSummaryStatus).toHaveBeenCalledWith('order-123')
    expect(mock._updateMock).toHaveBeenCalledWith({ status: '已做完' })
  })

  it('handles nested payload format (data wrapper)', async () => {
    vi.mocked(updateSummaryStatus).mockResolvedValue('已付款')
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const payload = {
      data: {
        properties: {
          'Order ID': {
            title: [{ text: { content: 'order-456' } }],
          },
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(200)
    expect(updateSummaryStatus).toHaveBeenCalledWith('order-456')
  })

  it('returns 400 if Order ID is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(updateSummaryStatus).mockRejectedValue(new Error('Notion error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const payload = {
      properties: {
        'Order ID': {
          title: [{ text: { content: 'order-789' } }],
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
