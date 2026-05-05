import type { Tables } from './types'

type Order = Tables<'orders'>
type OrderItem = Pick<Tables<'order_items'>, 'menu_item_id' | 'quantity' | 'unit_price'> & {
  name: string
}

export async function syncOrderToNotion(
  order: Order,
  items: OrderItem[],
): Promise<string> {
  const token = process.env.NOTION_API_TOKEN
  const databaseId = process.env.NOTION_ORDERS_DATABASE_ID
  if (!token || !databaseId) throw new Error('Notion env vars not set')

  const body = {
    parent: { database_id: databaseId },
    properties: {
      'Order ID': { title: [{ text: { content: order.id } }] },
      'Customer Name': { rich_text: [{ text: { content: order.customer_name } }] },
      Items: { multi_select: items.map((i) => ({ name: `${i.name} x${i.quantity}` })) },
      Total: { number: order.total },
      Status: { select: { name: 'Pending' } },
      Timestamp: { date: { start: order.created_at } },
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
