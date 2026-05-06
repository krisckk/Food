// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateSummaryStatus, STATUS_PROGRESSION } from './notion'

// Mock environment variables
process.env.NOTION_API_TOKEN = 'test-token'
process.env.NOTION_ORDERS_DATABASE_ID = 'test-db'

describe('updateSummaryStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('calculates min status correctly and updates summary', async () => {
    // 1. Mock Query Response
    const mockResults = [
      {
        id: 'summary-id',
        properties: {
          'Is Summary': { checkbox: true },
          Status: { select: { name: '已點餐' } },
        },
      },
      {
        id: 'cat-1-id',
        properties: {
          'Is Summary': { checkbox: false },
          Status: { select: { name: '已付款' } },
        },
      },
      {
        id: 'cat-2-id',
        properties: {
          'Is Summary': { checkbox: false },
          Status: { select: { name: '已做完' } },
        },
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    } as any)

    // 2. Mock Update Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'summary-id' }),
    } as any)

    const result = await updateSummaryStatus('order-123')

    // Min of '已付款' and '已做完' is '已付款'
    expect(result).toBe('已付款')
    
    // Check fetch calls
    expect(fetch).toHaveBeenCalledTimes(2)
    
    // Second call should be the PATCH to summary page
    const [url, options] = vi.mocked(fetch).mock.calls[1]
    expect(url).toContain('pages/summary-id')
    expect(JSON.parse(options?.body as string).properties.Status.select.name).toBe('已付款')
  })

  it('does not update if status is already at target', async () => {
    const mockResults = [
      {
        id: 'summary-id',
        properties: {
          'Is Summary': { checkbox: true },
          Status: { select: { name: '已付款' } },
        },
      },
      {
        id: 'cat-1-id',
        properties: {
          'Is Summary': { checkbox: false },
          Status: { select: { name: '已付款' } },
        },
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    } as any)

    const result = await updateSummaryStatus('order-123')

    expect(result).toBe('已付款')
    expect(fetch).toHaveBeenCalledTimes(1) // Only query, no update
  })

  it('returns null if no pages found', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as any)

    const result = await updateSummaryStatus('order-empty')
    expect(result).toBeNull()
  })
})
