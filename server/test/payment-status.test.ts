import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const testDataDir = join(import.meta.dir, '.test-data');
mkdirSync(testDataDir, { recursive: true });
const dbPath = join(testDataDir, 'payment-status-test.db');
process.env.DB_PATH = dbPath;
process.env.JWT_SECRET = 'test-secret';
process.env.RESEND_API_KEY = '';
rmSync(dbPath, { force: true });
rmSync(dbPath + '-wal', { force: true });
rmSync(dbPath + '-shm', { force: true });

const { default: server } = await import('../src/index');
const { getDb } = await import('../src/db');
const { signToken } = await import('../src/auth');

const db = getDb();

const adminToken = await signToken({ id: 'admin-test', email: 'admin@test.com', name: 'Admin', isAdmin: true });

let orderId: string;

function request(url: string, init?: RequestInit) {
  return server.fetch(new Request(`http://localhost${url}`, init));
}

async function patchPaymentStatus(id: string, paymentStatus: string) {
  return request(`/api/orders/${id}/payment-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ paymentStatus }),
  });
}

beforeAll(async () => {
  const res = await request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test User',
      customerEmail: 'test@test.com',
      shippingAddress: { address: 'Calle 1', city: 'CABA', province: 'CABA', postalCode: '1424', phone: '11-1111-1111' },
      items: [{ productId: '1', productName: 'Sábanas de Algodón Egipcio 400 Hilos', quantity: 1, price: 45900 }],
      subtotal: 45900, shippingCost: 0, total: 45900,
      paymentMethod: 'transferencia', paymentStatus: 'pendiente', source: 'web',
    }),
  });
  expect(res.status).toBe(201);
  const created = await res.json();
  orderId = created.id;
});

afterAll(() => {
  db.close();
  rmSync(dbPath, { force: true });
  rmSync(dbPath + '-wal', { force: true });
  rmSync(dbPath + '-shm', { force: true });
});

describe('server PATCH /api/orders/:id/payment-status', () => {
  test('confirma el pago de una orden pendiente → aprobado, sin tocar stock', async () => {
    const stockBefore = (db.query('SELECT stock FROM products WHERE id = ?').get('1') as { stock: number }).stock;

    const res = await patchPaymentStatus(orderId, 'aprobado');
    expect(res.status).toBe(200);

    const row = db.query('SELECT payment_status FROM orders WHERE id = ?').get(orderId) as { payment_status: string };
    expect(row.payment_status).toBe('aprobado');

    const stockAfter = (db.query('SELECT stock FROM products WHERE id = ?').get('1') as { stock: number }).stock;
    expect(stockAfter).toBe(stockBefore);
  });

  test('confirmar una orden ya aprobada es idempotente (200, sin cambios)', async () => {
    const res = await patchPaymentStatus(orderId, 'aprobado');
    expect(res.status).toBe(200);

    const row = db.query('SELECT payment_status FROM orders WHERE id = ?').get(orderId) as { payment_status: string };
    expect(row.payment_status).toBe('aprobado');
  });

  test('rechaza con 400 cualquier valor distinto de aprobado', async () => {
    const res = await patchPaymentStatus(orderId, 'rechazado');
    expect(res.status).toBe(400);

    const row = db.query('SELECT payment_status FROM orders WHERE id = ?').get(orderId) as { payment_status: string };
    expect(row.payment_status).toBe('aprobado');
  });

  test('rechaza con 400 sin body', async () => {
    const res = await request(`/api/orders/${orderId}/payment-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('devuelve 404 si la orden no existe', async () => {
    const res = await patchPaymentStatus('ORD-NO-EXISTE', 'aprobado');
    expect(res.status).toBe(404);
  });
});
