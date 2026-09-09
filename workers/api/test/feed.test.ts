import { describe, expect, test } from 'bun:test';
import type { Env } from '../src/types';
import { handleFeed, buildFeedXml, type ProductRow } from '../src/routes/feed';

class FakeDb {
  private rows: ProductRow[];

  constructor(rows: ProductRow[]) {
    this.rows = rows;
  }

  prepare(sql: string) {
    const rows = this.rows;
    return {
      bind() {
        return this;
      },
      async all<T>(): Promise<{ results: T[] }> {
        if (sql.includes('FROM products')) {
          const filtered = rows.filter((r) => r.active === 1 && Number(r.price) > 0);
          return { results: filtered as unknown as T[] };
        }
        return { results: [] };
      },
    };
  }
}

const rows: ProductRow[] = [
  {
    id: '1000000000001',
    name: 'Sábanas & Cobertor "Premium"',
    description: 'Algodón 100% <Premium>, línea Otoño & Co.',
    brand: 'Casa Lino',
    category: 'Sábanas',
    subcategory: 'Ropa de cama',
    price: 45900.5,
    stock: 15,
    image: 'https://i.ibb.co/abc/main.jpg',
    images_json: '["https://i.ibb.co/abc/second.jpg","https://i.ibb.co/abc/main.jpg"]',
    slug: 'sabanas-premium',
    active: 1,
  },
  {
    id: '1000000000002',
    name: 'Out of stock',
    description: 'Sin stock',
    brand: 'AIKEN',
    category: 'Toallas',
    subcategory: '',
    price: 1000,
    stock: 0,
    image: 'https://i.ibb.co/def/towel.jpg',
    images_json: '[]',
    slug: '',
    active: 1,
  },
  {
    id: '1000000000003',
    name: 'Inactivo',
    description: 'No debe aparecer',
    brand: 'AIKEN',
    category: 'Toallas',
    subcategory: '',
    price: 2000,
    stock: 5,
    image: 'https://i.ibb.co/ghi/inactive.jpg',
    images_json: '[]',
    slug: 'inactivo',
    active: 0,
  },
  {
    id: '1000000000004',
    name: 'Sin precio',
    description: 'No debe aparecer',
    brand: 'AIKEN',
    category: 'Toallas',
    subcategory: '',
    price: 0,
    stock: 5,
    image: 'https://i.ibb.co/jkl/noprice.jpg',
    images_json: '[]',
    slug: 'sin-precio',
    active: 1,
  },
];

const env = {
  SITE_URL: 'https://aikenblanco.com.ar',
  DB: new FakeDb(rows),
} as unknown as Env;

const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;

describe('GET /feed.xml (Meta Commerce Manager)', () => {
  test('devuelve 200 con Content-Type XML y al menos un <item>', async () => {
    const res = await handleFeed(new Request('https://aikenblanco.com.ar/feed.xml'), env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=');

    const xml = await res.text();
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain('<item>');
  });

  test('solo incluye productos activos con precio > 0', async () => {
    const res = await handleFeed(new Request('https://aikenblanco.com.ar/feed.xml'), env, ctx);
    const xml = await res.text();
    expect(xml).toContain('<g:id>1000000000001</g:id>');
    expect(xml).toContain('<g:id>1000000000002</g:id>');
    expect(xml).not.toContain('Inactivo');
    expect(xml).not.toContain('Sin precio');
    expect((xml.match(/<item>/g) ?? []).length).toBe(2);
  });

  test('mapea disponibilidad desde stock real', async () => {
    const res = await handleFeed(new Request('https://aikenblanco.com.ar/feed.xml'), env, ctx);
    const xml = await res.text();
    expect(xml).toContain('<g:availability>in stock</g:availability>');
    expect(xml).toContain('<g:availability>out of stock</g:availability>');
  });

  test('genera g:price en formato "1234.56 ARS"', async () => {
    const res = await handleFeed(new Request('https://aikenblanco.com.ar/feed.xml'), env, ctx);
    const xml = await res.text();
    expect(xml).toContain('<g:price>45900.50 ARS</g:price>');
    expect(xml).toContain('<g:condition>new</g:condition>');
    expect(xml).toContain('<g:brand>Casa Lino</g:brand>');
  });

  test('usa brand fallback AIKEN y URL con slug / solo id', async () => {
    const xml = buildFeedXml(rows, env.SITE_URL);
    expect(xml).toContain('<g:brand>AIKEN</g:brand>');
    expect(xml).toContain('<g:link>https://aikenblanco.com.ar/producto/sabanas-premium-1000000000001</g:link>');
    expect(xml).toContain('https://aikenblanco.com.ar/producto/1000000000002');
  });

  test('escapa &, <, >, " y \' en título/descripción', async () => {
    const xml = buildFeedXml([rows[0]], env.SITE_URL);
    expect(xml).toContain('Sábanas &amp; Cobertor &quot;Premium&quot;');
    expect(xml).toContain('Algodón 100% &lt;Premium&gt;, línea Otoño &amp; Co.');
  });

  test('incluye g:additional_image_link solo con imágenes extra', async () => {
    const res = await handleFeed(new Request('https://aikenblanco.com.ar/feed.xml'), env, ctx);
    const xml = await res.text();
    expect(xml).toContain('<g:additional_image_link>https://i.ibb.co/abc/second.jpg</g:additional_image_link>');
    expect(xml).not.toContain('<g:additional_image_link>https://i.ibb.co/abc/main.jpg</g:additional_image_link>');
  });
});