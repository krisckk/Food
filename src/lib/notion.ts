import type { Tables } from './types'

type Order = Tables<'orders'>
type OrderItem = Pick<Tables<'order_items'>, 'menu_item_id' | 'quantity' | 'unit_price'> & {
  name: string
}

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
    token, databaseId, order, items, allCategories, order.total, true,
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
