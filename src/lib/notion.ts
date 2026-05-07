import type { Tables } from './types'

type Order = Tables<'orders'>
type OrderItem = Pick<Tables<'order_items'>, 'menu_item_id' | 'quantity' | 'unit_price'> & {
  name: string
}

export const STATUS_PROGRESSION = ['已點餐', '已付款', '已做完', '已送達', 'Done'] as const
export type OrderStatus = (typeof STATUS_PROGRESSION)[number]

type NotionStatusProp = {
  type?: string
  checkbox?: boolean
  select?: { name: string }
  status?: { name: string }
}
type NotionPageResult = { id: string; properties: Record<string, NotionStatusProp | undefined> }

async function createNotionPage(
  token: string,
  databaseId: string,
  order: Order,
  items: OrderItem[],
  categories: string[],
  total: number,
  isSummary: boolean,
): Promise<string> {
  const body = {
    parent: { database_id: databaseId },
    properties: {
      'Order ID': { title: [{ text: { content: order.id } }] },
      'Customer Name': { rich_text: [{ text: { content: order.customer_name } }] },
      Items: { multi_select: items.map((i) => ({ name: `${i.name} x${i.quantity}` })) },
      Total: { number: total },
      Category: { multi_select: categories.map((c) => ({ name: c })) },
      Status: { select: { name: '已點餐' } },
      Timestamp: { date: { start: order.created_at } },
      'Is Summary': { checkbox: isSummary },
    },
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion API error ${res.status}: ${text}`)
  }

  const page = (await res.json()) as { id: string }
  return page.id
}

export async function syncOrderToNotion(
  order: Order,
  items: OrderItem[],
  itemCategories: string[], // one category per item, parallel to items array
): Promise<string> {
  const token = process.env.NOTION_API_TOKEN
  const databaseId = process.env.NOTION_ORDERS_DATABASE_ID
  if (!token || !databaseId) throw new Error('Notion env vars not set')

  // Master page — one per order, for the whole view
  const allCategories = Array.from(new Set(itemCategories))
  const masterPageId = await createNotionPage(
    token,
    databaseId,
    order,
    items,
    allCategories,
    order.total,
    true,
  )

  // Per-category pages — for category-specific views
  const byCategory = new Map<string, OrderItem[]>()
  items.forEach((item, idx) => {
    const cat = itemCategories[idx]
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(item)
  })

  for (const [category, catItems] of Array.from(byCategory)) {
    const subtotal = catItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    await createNotionPage(token, databaseId, order, catItems, [category], subtotal, false)
  }

  return masterPageId
}

export async function updateSummaryStatus(orderId: string): Promise<string | null> {
  const token = process.env.NOTION_API_TOKEN
  const databaseId = process.env.NOTION_ORDERS_DATABASE_ID
  if (!token || !databaseId) throw new Error('Notion env vars not set')

  console.log(`[notion] Starting bi-directional sync for Order ID: ${orderId}`)

  // 1. Fetch all pages for this Order ID
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: {
        property: 'Order ID',
        title: { equals: orderId },
      },
    }),
  })

  if (!queryRes.ok) {
    const text = await queryRes.text()
    console.error(`[notion] Query failed for ${orderId}:`, text)
    throw new Error(`Notion Query error ${queryRes.status}: ${text}`)
  }

  const { results } = (await queryRes.json()) as { results: NotionPageResult[] }
  if (results.length === 0) return null

  const summaryPage = results.find((p) => p.properties['Is Summary']?.checkbox === true)
  const categoryPages = results.filter((p) => p.properties['Is Summary']?.checkbox === false)

  if (!summaryPage || categoryPages.length === 0) return null

  const summaryStatusProp = summaryPage.properties.Status
  const currentSummaryStatus = (summaryStatusProp?.select?.name || summaryStatusProp?.status?.name) as OrderStatus
  const summaryStatusIndex = STATUS_PROGRESSION.indexOf(currentSummaryStatus)

  // 2. Calculate the MINIMUM and MAXIMUM status across all category pages
  let minCategoryStatusIndex = STATUS_PROGRESSION.length - 1
  let maxCategoryStatusIndex = 0

  for (const page of categoryPages) {
    const statusProp = page.properties.Status
    const statusName = (statusProp?.select?.name || statusProp?.status?.name) as OrderStatus
    const statusIndex = STATUS_PROGRESSION.indexOf(statusName)
    
    if (statusIndex !== -1) {
      if (statusIndex < minCategoryStatusIndex) minCategoryStatusIndex = statusIndex
      if (statusIndex > maxCategoryStatusIndex) maxCategoryStatusIndex = statusIndex
    }
  }

  // BI-DIRECTIONAL LOGIC:
  // A. Top-Down Sync: If Summary is "ahead" of ALL categories, push Summary status down
  if (summaryStatusIndex > maxCategoryStatusIndex) {
    console.log(`[notion] Top-Down Sync: Summary (${currentSummaryStatus}) is ahead of categories. Pushing down...`)
    
    const patchPromises = categoryPages.map(page => {
      const catStatusProp = page.properties.Status
      const statusUpdate = catStatusProp?.type === 'status' 
        ? { status: { name: currentSummaryStatus } }
        : { select: { name: currentSummaryStatus } }

      return fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ properties: { Status: statusUpdate } }),
      })
    })

    await Promise.all(patchPromises)
    return currentSummaryStatus
  }

  // B. Bottom-Up Sync: If Summary is "behind" the minimum category, pull Summary status up
  const targetSummaryStatus = STATUS_PROGRESSION[minCategoryStatusIndex]
  if (targetSummaryStatus !== currentSummaryStatus) {
    console.log(`[notion] Bottom-Up Sync: Updating summary to ${targetSummaryStatus} (min of categories)`)
    
    const summaryUpdate = summaryStatusProp?.type === 'status' 
      ? { status: { name: targetSummaryStatus } }
      : { select: { name: targetSummaryStatus } }

    await fetch(`https://api.notion.com/v1/pages/${summaryPage.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties: { Status: summaryUpdate } }),
    })

    return targetSummaryStatus
  }

  return currentSummaryStatus
}
