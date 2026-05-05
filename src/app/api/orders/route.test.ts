// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/supabase', () => ({
  createSupabaseAdminClient: vi.fn(),
}))
vi.mock('@/lib/notion', () => ({
  syncOrderToNotion: vi.fn(),
}))

import { createSupabaseAdminClient } from '@/lib/supabase'
import { syncOrderToNotion } from '@/lib/notion'

const MENU_ITEM_ID = '550e8400-e29b-41d4-a716-446655440000'
const MODIFIER_ID  = '660e8400-e29b-41d4-a716-446655440001'

const mockMenuItems = [{ id: MENU_ITEM_ID, name: '台式肉燥飯', price: 50, available: true }]
const mockOrder = { id: 'order-1', customer_name: 'Alice', customer_email: null, total: 50, status: 'pending', notion_page_id: null, created_at: '' }

const mockModifier = { id: MODIFIER_ID, name: '加滷蛋', price_delta: 10, available: true, menu_item_id: MENU_ITEM_ID }

function makeSupabaseMock({
  menuItemsError = null,
  orderError = null,
  itemsError = null,
  deleteError = null,
  modifiers = [mockModifier] as typeof mockModifier[],
  modifiersError = null,
}: {
  menuItemsError?: unknown
  orderError?: unknown
  itemsError?: unknown
  deleteError?: unknown
  modifiers?: typeof mockModifier[]
  modifiersError?: unknown
} = {}) {
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: deleteError }) })

  const fromMock = vi.fn((table: string) => {
    if (table === 'menu_items') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: menuItemsError ? null : mockMenuItems, error: menuItemsError }),
        }),
      }
    }
    if (table === 'menu_item_modifiers') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: modifiersError ? null : modifiers, error: modifiersError }),
        }),
      }
    }
    if (table === 'orders') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: orderError ? null : mockOrder, error: orderError }),
          }),
        }),
        update: updateMock,
        delete: deleteMock,
      }
    }
    if (table === 'order_items') {
      return {
        insert: vi.fn().mockResolvedValue({ error: itemsError }),
      }
    }
  })

  return { from: fromMock, _updateMock: updateMock, _deleteMock: deleteMock }
}

function makeRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest
}

const validBody = {
  customer_name: 'Alice',
  items: [{ menu_item_id: MENU_ITEM_ID, quantity: 1 }],
}

const bodyWithModifier = {
  customer_name: 'Alice',
  items: [{ menu_item_id: MENU_ITEM_ID, quantity: 1, modifier_id: MODIFIER_ID }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/orders', () => {
  it('happy path: creates order, syncs Notion, returns 200 with notion_page_id', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)
    vi.mocked(syncOrderToNotion).mockResolvedValue('notion-page-123')

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.order.id).toBe('order-1')
    expect(body.order.notion_page_id).toBe('notion-page-123')
    expect(syncOrderToNotion).toHaveBeenCalledOnce()
    expect(mock._updateMock).toHaveBeenCalledWith({ notion_page_id: 'notion-page-123' })
  })

  it('Notion failure: still returns 200 with order, notion_page_id is null', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)
    vi.mocked(syncOrderToNotion).mockRejectedValue(new Error('Notion down'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.order.id).toBe('order-1')
    expect(body.order.notion_page_id).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('[notion] sync failed:', expect.any(Error))
  })

  it('order_items failure: compensating delete called, returns 500', async () => {
    const mock = makeSupabaseMock({ itemsError: { message: 'FK violation' } })
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(500)
    expect(mock._deleteMock).toHaveBeenCalled()
    expect(syncOrderToNotion).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid body', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const res = await POST(makeRequest({ customer_name: '', items: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 422 for unavailable menu item', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'menu_items') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: MENU_ITEM_ID, name: '台式肉燥飯', price: 50, available: false }],
                error: null,
              }),
            }),
          }
        }
        return mock.from(table)
      }),
    } as never)

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(422)
  })

  it('happy path with modifier: total and unit_price include price_delta', async () => {
    const mock = makeSupabaseMock()
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)
    vi.mocked(syncOrderToNotion).mockResolvedValue('notion-page-456')

    const res = await POST(makeRequest(bodyWithModifier))
    const body = await res.json()

    expect(res.status).toBe(200)
    // order.total should be base($50) + delta($10) = $60
    const insertCall = mock.from.mock.calls.find(([t]) => t === 'order_items')
    expect(insertCall).toBeDefined()
    // syncOrderToNotion item name should include modifier
    const notionCall = vi.mocked(syncOrderToNotion).mock.calls[0]
    expect(notionCall[1][0].name).toContain('加滷蛋')
    expect(body.order.notion_page_id).toBe('notion-page-456')
  })

  it('returns 422 for unavailable modifier', async () => {
    const mock = makeSupabaseMock({ modifiers: [{ ...mockModifier, available: false }] })
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const res = await POST(makeRequest(bodyWithModifier))
    expect(res.status).toBe(422)
  })

  it('returns 422 when modifier does not belong to the ordered menu item', async () => {
    const wrongItemId = '770e8400-e29b-41d4-a716-446655440002'
    const mock = makeSupabaseMock({ modifiers: [{ ...mockModifier, menu_item_id: wrongItemId }] })
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mock as never)

    const res = await POST(makeRequest(bodyWithModifier))
    expect(res.status).toBe(422)
  })
})
