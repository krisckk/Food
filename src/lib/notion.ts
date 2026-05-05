import type { Tables } from './types'

type Order = Tables<'orders'>
type OrderItem = Pick<Tables<'order_items'>, 'menu_item_id' | 'quantity' | 'unit_price'>

// Returns the created Notion page ID.
// Throws on failure — caller decides whether to propagate.
export async function syncOrderToNotion(
  order: Order,
  items: OrderItem[],
): Promise<string> {
  // TODO: implement with Notion MCP (create page in Orders database)
  void order
  void items
  throw new Error('Notion sync not yet implemented')
}
