import type { Tables } from './types'

type Order = Tables<'orders'>
type OrderItem = Pick<Tables<'order_items'>, 'menu_item_id' | 'quantity' | 'unit_price'> & {
  name: string
}

export const STATUS_PROGRESSION = ['已點餐', '已付款', '已做完', '已送達', 'Done'] as const
export type OrderStatus = (typeof STATUS_PROGRESSION)[number]

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

  console.log(`[notion] Starting sync for Order ID: ${orderId}`)

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

  const { results } = (await queryRes.json()) as { results: any[] }
  console.log(`[notion] Found ${results.length} pages for order ${orderId}`)

  if (results.length === 0) return null

  const summaryPage = results.find((p) => p.properties['Is Summary']?.checkbox === true)
  const categoryPages = results.filter((p) => p.properties['Is Summary']?.checkbox === false)

  console.log(`[notion] Summary page found: ${!!summaryPage}, Category pages: ${categoryPages.length}`)

  if (!summaryPage || categoryPages.length === 0) return null

  // 2. Calculate the minimum status across all category pages
  let minStatusIndex = STATUS_PROGRESSION.length - 1

  for (const page of categoryPages) {
    // Handle both 'select' and 'status' property types for robustness
    const statusProp = page.properties.Status
    const statusName = (statusProp?.select?.name || statusProp?.status?.name) as OrderStatus
    
    const statusIndex = STATUS_PROGRESSION.indexOf(statusName)
    console.log(`[notion] Page ${page.id} has status: ${statusName} (index ${statusIndex})`)
    
    if (statusIndex !== -1 && statusIndex < minStatusIndex) {
      minStatusIndex = statusIndex
    }
  }

  const targetStatus = STATUS_PROGRESSION[minStatusIndex]
  const summaryStatusProp = summaryPage.properties.Status
  const currentSummaryStatus = summaryStatusProp?.select?.name || summaryStatusProp?.status?.name

  console.log(`[notion] Order ${orderId}: Target=${targetStatus}, Current=${currentSummaryStatus}`)

  // 3. Update summary page if status changed
  if (targetStatus !== currentSummaryStatus) {
    console.log(`[notion] Updating summary page ${summaryPage.id} to ${targetStatus}`)
    
    // Determine property update based on what the page already has
    const statusUpdate = summaryStatusProp?.type === 'status' 
      ? { status: { name: targetStatus } }
      : { select: { name: targetStatus } }

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${summaryPage.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          Status: statusUpdate,
        },
      }),
    })

    if (!updateRes.ok) {
      const text = await updateRes.text()
      console.error(`[notion] Update failed for ${summaryPage.id}:`, text)
      throw new Error(`Notion Update error ${updateRes.status}: ${text}`)
    }

    return targetStatus
  }

  return currentSummaryStatus as string
}
