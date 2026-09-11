import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';
import { slugify } from '../utils/slugify';
import { computeComboStock, computeComboWeight, type ComboComponent } from '../services/stock';

export interface ComboRow {
  id: string; name: string; description: string; price: number; image: string;
  slug: string; active: number; created_at: string;
}

export interface ComboItemRow {
  id: string; combo_id: string; product_id: string;
  variant: string | null; color: string | null; quantity: number;
}

export interface ComboProductLike {
  id: string; name: string; stock: number; weight: number; variant_stock_json?: string;
}

function getComboViews(rows: ComboItemRow[], productsById: Map<string, ComboProductLike>) {
  return (rows || [])
    .filter((r) => productsById.has(r.product_id))
    .map((r) => ({
      id: r.id,
      comboId: r.combo_id,
      productId: r.product_id,
      productName: productsById.get(r.product_id)?.name || r.product_id,
      variant: r.variant || undefined,
      color: r.color || undefined,
      quantity: r.quantity || 1,
    }));
}

function comboComponents(views: ReturnType<typeof getComboViews>): ComboComponent[] {
  return views.map((v) => ({ productId: v.productId, variant: v.variant, color: v.color, quantity: v.quantity }));
}

export function loadComboProducts(activeOnly: boolean) {
  const db = getDb();
  const comboRows = (db.query(
    activeOnly
      ? 'SELECT * FROM combos WHERE active = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM combos ORDER BY created_at DESC'
  ).all() as ComboRow[]);

  let itemsByCombo = new Map<string, ReturnType<typeof getComboViews>>();
  let productsById = new Map<string, ComboProductLike>();
  if (comboRows.length > 0) {
    const productRows = db.query(
      'SELECT id, name, stock, weight, variant_stock_json FROM products'
    ).all() as ComboProductLike[];
    productsById = new Map(productRows.map((p) => [p.id, p]));

    const placeholders = comboRows.map(() => '?').join(', ');
    const itemRows = db.query(
      `SELECT * FROM combo_items WHERE combo_id IN (${placeholders})`
    ).all(...comboRows.map((c) => c.id)) as ComboItemRow[];

    const views = getComboViews(itemRows, productsById);
    itemsByCombo = new Map<string, typeof views>();
    for (const row of comboRows) itemsByCombo.set(row.id, []);
    for (const v of views) {
      const list = itemsByCombo.get(v.comboId);
      if (list) list.push(v);
    }
  }
  return { comboRows, itemsByCombo, productsById };
}

export function formatComboAdmin(row: ComboRow, items: ReturnType<typeof getComboViews>, productsById: Map<string, ComboProductLike>) {
  const components = comboComponents(items);
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    price: row.price,
    image: row.image || undefined,
    slug: row.slug || undefined,
    active: row.active === 1,
    comboItems: items,
    stock: computeComboStock(components, productsById),
    weight: computeComboWeight(components, productsById),
  };
}

export function buildComboProduct(row: ComboRow, items: ReturnType<typeof getComboViews>, productsById: Map<string, ComboProductLike>) {
  const components = comboComponents(items);
  const slug = row.slug || slugify(row.name);
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    brand: 'Aiken Blanco',
    category: 'Combos',
    subcategory: undefined,
    price: row.price,
    stock: computeComboStock(components, productsById),
    image: row.image || '',
    images: [],
    variants: [],
    colors: [],
    variantStock: {},
    ambientes: [],
    weight: computeComboWeight(components, productsById) || undefined,
    width: undefined,
    height: undefined,
    length: undefined,
    featured: false,
    isNew: false,
    slug,
    active: row.active === 1,
    isCombo: true,
    comboItems: items.map((v) => ({
      productId: v.productId,
      productName: v.productName,
      variant: v.variant,
      color: v.color,
      quantity: v.quantity,
    })),
  };
}

interface BodyItem {
  productId?: string;
  variant?: string | null;
  color?: string | null;
  quantity?: number;
}

interface ComboBodyInput {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  image?: unknown;
  slug?: unknown;
  comboItems?: unknown;
}

function validateComboBody(body: ComboBodyInput): { name: string; description: string; price: number; image: string; slug: string; items: BodyItem[] } | { error: string } {
  const name = String(body?.name ?? '').trim();
  const price = Number(body?.price ?? '');
  const items = Array.isArray(body?.comboItems) ? (body.comboItems as BodyItem[]) : [];
  if (!name) return { error: 'El nombre del combo es obligatorio' };
  if (!Number.isFinite(price) || price < 0) return { error: 'El precio del combo debe ser un número mayor o igual a 0' };
  if (items.length < 2) return { error: 'El combo debe tener al menos 2 componentes' };
  if (items.some((i) => !i?.productId || !i.quantity || i.quantity < 1)) return { error: 'Cada componente debe indicar un producto y una cantidad mayor a 0' };
  return {
    name,
    description: String(body?.description ?? ''),
    price,
    image: String(body?.image ?? ''),
    slug: slugify(String(body?.slug !== undefined && body.slug !== '' ? body.slug : body.name)),
    items,
  };
}

function insertComboItems(db: ReturnType<typeof getDb>, comboId: string, items: BodyItem[]) {
  items.forEach((item, i) => {
    db.query(
      'INSERT INTO combo_items (id, combo_id, product_id, variant, color, quantity) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      `coi-${Date.now()}-${i}`, comboId, item.productId,
      item.variant || null, item.color || null, item.quantity ?? 1
    );
  });
}

const combos = new Hono();

combos.get('/', (c) => {
  const { comboRows, itemsByCombo, productsById } = loadComboProducts(false);
  return c.json(comboRows.map((row) => formatComboAdmin(row, itemsByCombo.get(row.id) || [], productsById)));
});

combos.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const validated = validateComboBody(body);
  if ('error' in validated) { c.status(400); return c.json({ error: validated.error }); }
  const db = getDb();
  if (validated.items.length > 0) {
    const placeholders = validated.items.map(() => '?').join(', ');
    const existing = db.query(`SELECT COUNT(*) as n FROM products WHERE id IN (${placeholders})`)
      .get(...validated.items.map((i) => i.productId)) as { n: number };
    if (!existing || existing.n !== validated.items.length) { c.status(400); return c.json({ error: 'Uno o más componentes no existen' }); }
  }
  const id = String(Date.now());
  const createCombo = db.transaction((b: typeof validated) => {
    db.query(
      'INSERT INTO combos (id, name, description, price, image, slug, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).run(id, b.name, b.description, b.price, b.image, b.slug);
    insertComboItems(db, id, b.items);
  });
  createCombo(validated);
  const { comboRows, itemsByCombo, productsById } = loadComboProducts(false);
  const row = comboRows.find((r) => r.id === id)!;
  return c.json(formatComboAdmin(row, itemsByCombo.get(id) || [], productsById), 201);
});

combos.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const db = getDb();
  const existing = db.query('SELECT id FROM combos WHERE id = ?').get(c.req.param('id'));
  if (!existing) { c.status(404); return c.json({ error: 'Combo no encontrado' }); }
  const body = await c.req.json();
  const validated = validateComboBody(body);
  if ('error' in validated) { c.status(400); return c.json({ error: validated.error }); }
  if (validated.items.length > 0) {
    const placeholders = validated.items.map(() => '?').join(', ');
    const existingProducts = db.query(`SELECT COUNT(*) as n FROM products WHERE id IN (${placeholders})`)
      .get(...validated.items.map((i) => i.productId)) as { n: number };
    if (!existingProducts || existingProducts.n !== validated.items.length) { c.status(400); return c.json({ error: 'Uno o más componentes no existen' }); }
  }
  const update = db.transaction((b: typeof validated) => {
    db.query(
      "UPDATE combos SET name = ?, description = ?, price = ?, image = ?, slug = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(b.name, b.description, b.price, b.image, b.slug, c.req.param('id'));
    db.query('DELETE FROM combo_items WHERE combo_id = ?').run(c.req.param('id'));
    insertComboItems(db, c.req.param('id'), b.items);
  });
  update(validated);
  const { comboRows, itemsByCombo, productsById } = loadComboProducts(false);
  const row = comboRows.find((r) => r.id === c.req.param('id'))!;
  return c.json(formatComboAdmin(row, itemsByCombo.get(c.req.param('id')) || [], productsById));
});

combos.delete('/:id', authMiddleware, adminMiddleware, (c) => {
  const db = getDb();
  db.run('DELETE FROM combos WHERE id = ?', c.req.param('id'));
  return c.json({ ok: true });
});

export default combos;