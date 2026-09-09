import type { Env } from '../types';

const FEED_TTL = 60 * 60 * 12;
const DEFAULT_BASE_URL = 'https://aikenblanco.com.ar';

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  stock: number;
  image: string;
  images_json: string;
  slug: string;
  active: number;
}

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseImages(json: string): string[] {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed.filter((img) => typeof img === 'string' && img) : [];
  } catch {
    return [];
  }
}

function productUrl(base: string, row: ProductRow): string {
  return row.slug ? `${base}/producto/${row.slug}-${row.id}` : `${base}/producto/${row.id}`;
}

function itemXml(base: string, row: ProductRow): string {
  const name = row.name || row.id;
  const description = (row.description || '').trim() || name;
  const mainImage = (row.image || '').trim();
  if (!mainImage) return '';

  const additionalImages = parseImages(row.images_json)
    .filter((img) => img !== mainImage)
    .slice(0, 10);

  const availability = (row.stock ?? 0) > 0 ? 'in stock' : 'out of stock';
  const price = (Math.round(row.price * 100) / 100).toFixed(2);
  const brand = (row.brand || 'AIKEN').trim();
  const productType = row.subcategory ? `${row.category} > ${row.subcategory}` : row.category;
  const link = productUrl(base, row);

  const additional = additionalImages.length
    ? `\n      <g:additional_image_link>${additionalImages.map(escapeXml).join('</g:additional_image_link>\n      <g:additional_image_link>')}</g:additional_image_link>`
    : '';

  return [
    '    <item>',
    `      <title>${escapeXml(name)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <description>${escapeXml(description)}</description>`,
    `      <guid isPermaLink="false">${escapeXml(row.id)}</guid>`,
    `      <g:id>${escapeXml(row.id)}</g:id>`,
    `      <g:title>${escapeXml(name)}</g:title>`,
    `      <g:description>${escapeXml(description)}</g:description>`,
    `      <g:link>${escapeXml(link)}</g:link>`,
    `      <g:image_link>${escapeXml(mainImage)}</g:image_link>`,
    additional,
    `      <g:availability>${availability}</g:availability>`,
    `      <g:price>${price} ARS</g:price>`,
    `      <g:condition>new</g:condition>`,
    `      <g:brand>${escapeXml(brand)}</g:brand>`,
    `      <g:product_type>${escapeXml(productType)}</g:product_type>`,
    '    </item>',
  ].filter(Boolean).join('\n');
}

export function buildFeedXml(rows: ProductRow[], baseUrl: string): string {
  const items = rows.map((row) => itemXml(baseUrl, row)).filter(Boolean).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>AIKEN Blanquería</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    '    <description>Catálogo de productos AIKEN Blanquería</description>',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}

export async function handleFeed(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  const cache = typeof caches !== 'undefined' ? caches.default : undefined;
  if (cache) {
    const cached = await cache.match(request);
    if (cached) return cached;
  }

  const { results } = await env.DB.prepare(
    `SELECT id, name, description, brand, category, subcategory, price, stock, image, images_json, slug
     FROM products
     WHERE active = 1 AND price > 0
     ORDER BY id`
  ).all<ProductRow>();

  const base = (env.SITE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const xml = buildFeedXml(results, base);

  const response = new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `public, max-age=600, s-maxage=${FEED_TTL}`,
    },
  });

  if (cache) ctx.waitUntil(cache.put(request, response.clone()));

  return response;
}