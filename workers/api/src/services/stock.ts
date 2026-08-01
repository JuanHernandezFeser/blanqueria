export const escJsonKey = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export interface StockItem {
  productId: string;
  variant?: string;
  quantity: number;
}

export function parseOrderItems(itemsJson: string): StockItem[] {
  try {
    return JSON.parse(itemsJson || '[]') as StockItem[];
  } catch {
    return [];
  }
}

export function buildRestoreStockStatements(db: D1Database, items: StockItem[]): D1PreparedStatement[] {
  const stmts: D1PreparedStatement[] = [];
  for (const item of items || []) {
    const qty = item.quantity || 1;
    if (item.variant) {
      const path = `$."${escJsonKey(String(item.variant))}"`;
      stmts.push(db.prepare(
        `UPDATE products SET variant_stock_json = json_set(variant_stock_json, ?, COALESCE(json_extract(variant_stock_json, ?), 0) + ?) WHERE id = ?`
      ).bind(path, path, qty, item.productId));
    } else {
      stmts.push(db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').bind(qty, item.productId));
    }
  }
  return stmts;
}
