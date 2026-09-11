import type { Env } from '../types';
import { requireAdmin } from '../auth';
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

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export function comboItemViews(rows: ComboItemRow[], productsById: Map<string, ComboProductLike>) {
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

function comboComponents(views: ReturnType<typeof comboItemViews>): ComboComponent[] {
  return views.map((v) => ({ productId: v.productId, variant: v.variant, color: v.color, quantity: v.quantity }));
}

export async function loadComboProducts(
  db: D1Database,
  { activeOnly }: { activeOnly: boolean }
): Promise<{ comboRows: ComboRow[]; itemsByCombo: Map<string, ReturnType<typeof comboItemViews>>; productsById: Map<string, ComboProductLike> }> {
  const comboRows = (
    activeOnly
      ? await db.prepare('SELECT * FROM combos WHERE active = 1 ORDER BY created_at DESC').all<ComboRow>()
      : await db.prepare('SELECT * FROM combos ORDER BY created_at DESC').all<ComboRow>()
  ).results;

  let itemsByCombo = new Map<string, ReturnType<typeof comboItemViews>>();
  let productsById = new Map<string, ComboProductLike>();
  if (comboRows.length > 0) {
    const productRows = await db.prepare(
      'SELECT id, name, stock, weight, variant_stock_json FROM products'
    ).all<ComboProductLike>();
    productsById = new Map(productRows.results.map((p) => [p.id, p]));

    const itemRows = await db.prepare(
      'SELECT * FROM combo_items WHERE combo_id IN (' + comboRows.map(() => '?').join(', ') + ')'
    ).bind(...comboRows.map((c) => c.id)).all<ComboItemRow>();

    const views = comboItemViews(itemRows.results, productsById);
    itemsByCombo = new Map<string, typeof views>();
    for (const row of comboRows) itemsByCombo.set(row.id, []);
    for (const v of views) {
      const list = itemsByCombo.get(v.comboId);
      if (list) list.push(v);
    }
  }
  return { comboRows, itemsByCombo, productsById };
}

export function formatComboAdmin(row: ComboRow, items: ReturnType<typeof comboItemViews>, productsById: Map<string, ComboProductLike>) {
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

export function buildComboProduct(row: ComboRow, items: ReturnType<typeof comboItemViews>, productsById: Map<string, ComboProductLike>) {
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

function insertComboItems(db: D1Database, comboId: string, items: BodyItem[]) {
  const stmts: D1PreparedStatement[] = [];
  items.forEach((item, i) => {
    stmts.push(db.prepare(
      'INSERT INTO combo_items (id, combo_id, product_id, variant, color, quantity) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `coi-${Date.now()}-${i}`, comboId, item.productId,
      item.variant || null, item.color || null, item.quantity ?? 1
    ));
  });
  return stmts;
}

export async function handleCombos(request: Request, env: Env, _ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  // GET /api/combos (admin view: all combos + components + computed stock/weight)
  if (method === 'GET' && path === '/api/combos') {
    const { comboRows, itemsByCombo, productsById } = await loadComboProducts(env.DB, { activeOnly: false });
    return json(comboRows.map((row) => formatComboAdmin(row, itemsByCombo.get(row.id) || [], productsById)));
  }

  // POST /api/combos
  if (method === 'POST' && path === '/api/combos') {
    await requireAdmin(request, env);
    const body = await request.json() as ComboBodyInput;
    const validated = validateComboBody(body);
    if ('error' in validated) return json({ error: validated.error }, 400);
    if (validated.items.length > 0) {
      const existing = await env.DB.prepare(
        'SELECT COUNT(*) as n FROM products WHERE id IN (' + validated.items.map(() => '?').join(', ') + ')'
      ).bind(...validated.items.map((i) => i.productId)).first<{ n: number }>();
      if (!existing || existing.n !== validated.items.length) return json({ error: 'Uno o más componentes no existen' }, 400);
    }
    const id = String(Date.now());
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO combos (id, name, description, price, image, slug, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).bind(id, validated.name, validated.description, validated.price, validated.image, validated.slug),
      ...insertComboItems(env.DB, id, validated.items),
    ]);
    const { comboRows, itemsByCombo, productsById } = await loadComboProducts(env.DB, { activeOnly: false });
    const row = comboRows.find((r) => r.id === id);
    return json(formatComboAdmin(row!, itemsByCombo.get(id) || [], productsById), 201);
  }

  // PUT /api/combos/:id
  const comboMatch = path.match(/^\/api\/combos\/([^/]+)$/);
  if (method === 'PUT' && comboMatch) {
    await requireAdmin(request, env);
    const body = await request.json() as ComboBodyInput;
    const existing = await env.DB.prepare('SELECT id FROM combos WHERE id = ?').bind(comboMatch[1]).first();
    if (!existing) return json({ error: 'Combo no encontrado' }, 404);
    const validated = validateComboBody(body);
    if ('error' in validated) return json({ error: validated.error }, 400);
    if (validated.items.length > 0) {
      const existingProducts = await env.DB.prepare(
        'SELECT COUNT(*) as n FROM products WHERE id IN (' + validated.items.map(() => '?').join(', ') + ')'
      ).bind(...validated.items.map((i) => i.productId)).first<{ n: number }>();
      if (!existingProducts || existingProducts.n !== validated.items.length) return json({ error: 'Uno o más componentes no existen' }, 400);
    }
    const stmts: D1PreparedStatement[] = [
      env.DB.prepare(
        'UPDATE combos SET name = ?, description = ?, price = ?, image = ?, slug = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(validated.name, validated.description, validated.price, validated.image, validated.slug, comboMatch[1]),
      env.DB.prepare('DELETE FROM combo_items WHERE combo_id = ?').bind(comboMatch[1]),
      ...insertComboItems(env.DB, comboMatch[1], validated.items),
    ];
    await env.DB.batch(stmts);
    const { comboRows, itemsByCombo, productsById } = await loadComboProducts(env.DB, { activeOnly: false });
    const row = comboRows.find((r) => r.id === comboMatch[1]);
    return json(formatComboAdmin(row!, itemsByCombo.get(comboMatch[1]) || [], productsById));
  }

  // DELETE /api/combos/:id
  if (method === 'DELETE' && comboMatch) {
    await requireAdmin(request, env);
    await env.DB.prepare('DELETE FROM combos WHERE id = ?').bind(comboMatch[1]).run();
    return json({ ok: true });
  }

  return json({ error: 'Not found' }, 404);
}