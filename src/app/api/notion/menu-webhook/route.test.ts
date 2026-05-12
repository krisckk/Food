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

describe('POST /api/notion/menu-webhook', () => {
  it('updates item availability to false when status is "賣完"', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const payload = {
      properties: {
        Name: {
          title: [{ text: { content: '肉鬆小貝' } }],
        },
        Status: {
          status: { name: '賣完' },
        },
      },
    }

    const res = await POST(makeRequest(payload))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.available).toBe(false)
    expect(mock._updateMock).toHaveBeenCalledWith({ available: false })
    expect(mock._eqMock).toHaveBeenCalledWith('name', '肉鬆小貝')
  })

  it('updates item availability to true when checkbox "Available" is true', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const payload = {
      properties: {
        title: {
          title: [{ text: { content: '費南雪' } }],
        },
        Available: {
          type: 'checkbox',
          checkbox: true,
        },
      },
    }

    const res = await POST(makeRequest(payload))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.available).toBe(true)
    expect(mock._updateMock).toHaveBeenCalledWith({ available: true })
    expect(mock._eqMock).toHaveBeenCalledWith('name', '費南雪')
  })

  it('returns 400 if Name/title is missing', async () => {
    const payload = {
      properties: {
        Available: {
          type: 'checkbox',
          checkbox: true,
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(400)
  })

  it('returns 400 if properties are missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 500 on Supabase error', async () => {
    const mock = makeSupabaseMock()
    mock._eqMock.mockResolvedValue({ error: { message: 'DB Error' } })
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const payload = {
      properties: {
        Name: {
          title: [{ text: { content: '肉鬆小貝' } }],
        },
      },
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
