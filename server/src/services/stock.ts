type SqliteDb = { query(sql: string): { run(...params: (string | number | null)[]): unknown } };

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

export function buildRestoreStockStatements(db: SqliteDb, items: StockItem[]): { sql: string; params: unknown[] }[] {
  const stmts: { sql: string; params: unknown[] }[] = [];
  for (const item of items || []) {
    const qty = item.quantity || 1;
    if (item.variant) {
      const path = `$."${escJsonKey(String(item.variant))}"`;
      stmts.push({
        sql: `UPDATE products SET variant_stock_json = json_set(variant_stock_json, ?, COALESCE(json_extract(variant_stock_json, ?), 0) + ?) WHERE id = ?`,
        params: [path, path, qty, item.productId],
      });
    } else {
      stmts.push({ sql: 'UPDATE products SET stock = stock + ? WHERE id = ?', params: [qty, item.productId] });
    }
  }
  return stmts;
}

export interface ComboComponent {
  productId: string;
  variant?: string | null;
  color?: string | null;
  quantity: number;
}

export interface ComboProductLike {
  stock: number;
  variant_stock_json?: string;
  weight: number;
}

export function comboVariantKey(variant?: string | null, color?: string | null): string {
  if (variant && color) return `${variant}|||${color}`;
  if (variant) return variant;
  if (color) return color;
  return '__default__';
}

export function computeComboStock(components: ComboComponent[], productsById: Map<string, ComboProductLike>): number {
  let min = Infinity;
  for (const c of components || []) {
    const product = productsById.get(c.productId);
    if (!product) {
      min = 0;
      break;
    }
    let compStock: number;
    if (c.variant || c.color) {
      const key = comboVariantKey(c.variant, c.color);
      let stockJson: Record<string, number> = {};
      try { stockJson = JSON.parse(product.variant_stock_json || '{}'); } catch { /* ignore */ }
      compStock = stockJson[key] ?? 0;
    } else {
      compStock = product.stock;
    }
    min = Math.min(min, Math.floor(compStock / (c.quantity || 1)));
  }
  return Number.isFinite(min) && min > 0 ? min : 0;
}

export function computeComboWeight(components: ComboComponent[], productsById: Map<string, ComboProductLike>): number {
  let weight = 0;
  for (const c of components || []) {
    const product = productsById.get(c.productId);
    if (product) weight += (product.weight || 0) * (c.quantity || 1);
  }
  return weight;
}