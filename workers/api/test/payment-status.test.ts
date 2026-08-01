import { describe, expect, test } from 'bun:test';
import { handleOrders } from '../src/routes/orders';
import { signToken } from '../src/auth';

class FakeDb {
  orders: Map<string, { id: string; payment_status: string }>;

  constructor(orders: { id: string; payment_status: string }[]) {
    this.orders = new Map(orders.map((o) => [o.id, o]));
  }

  prepare(sql: string) {
    const db = this;
    return {
      bind(...args: any[]) {
        return {
          async first<T>(): Promise<T | null> {
            if (sql.includes('SELECT id, payment_status FROM orders')) {
              return (db.orders.get(args[0]) ?? null) as T;
            }
            return null;
          },
          async run() {
            if (sql.includes('UPDATE orders SET payment_status')) {
              const order = db.orders.get(args[1]);
              if (order) order.payment_status = args[0];
              return { meta: { changes: order ? 1 : 0 } };
            }
            return { meta: { changes: 0 } };
          },
          all() {
            return { results: [] };
          },
        };
      },
    };
  }
}

const JWT_SECRET = 'test-secret';
const env = {
  JWT_SECRET,
  DB: new FakeDb([
    { id: 'ORD-PENDIENTE', payment_status: 'pendiente' },
    { id: 'ORD-APROBADO', payment_status: 'aprobado' },
  ]),
} as any;

const ctx = { waitUntil: () => {} } as any;

const adminToken = await signToken({ id: 'a', email: 'a@a.com', name: 'A', isAdmin: true }, JWT_SECRET);

function patch(id: string, paymentStatus: string) {
  return handleOrders(
    new Request(`https://api.test/api/orders/${id}/payment-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    }),
    env,
    ctx,
    `/api/orders/${id}/payment-status`,
    'PATCH'
  );
}

describe('worker PATCH /api/orders/:id/payment-status', () => {
  test('confirma el pago de una orden pendiente → aprobado', async () => {
    const res = await patch('ORD-PENDIENTE', 'aprobado');
    expect(res.status).toBe(200);
    expect(env.DB.orders.get('ORD-PENDIENTE')!.payment_status).toBe('aprobado');
  });

  test('confirmar una orden ya aprobada es idempotente (200, sin cambios)', async () => {
    const res = await patch('ORD-APROBADO', 'aprobado');
    expect(res.status).toBe(200);
    expect(env.DB.orders.get('ORD-APROBADO')!.payment_status).toBe('aprobado');
  });

  test('rechaza con 400 cualquier valor distinto de aprobado', async () => {
    const res = await patch('ORD-PENDIENTE', 'rechazado');
    expect(res.status).toBe(400);
    expect(env.DB.orders.get('ORD-PENDIENTE')!.payment_status).toBe('aprobado');
  });

  test('rechaza con 400 sin body', async () => {
    const res = await handleOrders(
      new Request('https://api.test/api/orders/ORD-PENDIENTE/payment-status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      env,
      ctx,
      '/api/orders/ORD-PENDIENTE/payment-status',
      'PATCH'
    );
    expect(res.status).toBe(400);
  });

  test('devuelve 404 si la orden no existe', async () => {
    const res = await patch('ORD-NO-EXISTE', 'aprobado');
    expect(res.status).toBe(404);
  });
});
