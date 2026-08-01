import type { Env } from '../types';
import { buildRestoreStockStatements, parseOrderItems } from '../services/stock';
import { sendOrderAutoCancelledEmail } from '../mail';

const ABANDONMENT_MS = 2 * 60 * 60 * 1000;

interface AbandonedOrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  items_json: string;
}

export async function releaseAbandonedMpOrders(env: Env): Promise<{ processed: number; released: number; errors: number }> {
  const cutoff = new Date(Date.now() - ABANDONMENT_MS).toISOString();

  const { results } = await env.DB.prepare(
    `SELECT id, customer_name, customer_email, items_json FROM orders
     WHERE payment_method = 'mercadopago'
       AND payment_status = 'pendiente'
       AND order_status != 'Cancelado'
       AND date < ?`
  ).bind(cutoff).all<AbandonedOrderRow>();

  let released = 0;
  let errors = 0;

  for (const order of results) {
    try {
      const statusRes = await env.DB.prepare(
        `UPDATE orders SET order_status = 'Cancelado' WHERE id = ? AND order_status != 'Cancelado'`
      ).bind(order.id).run();

      if (statusRes.meta.changes === 0) {
        console.log(`[releaseAbandoned] Orden ${order.id} ya estaba cancelada; se omite`);
        continue;
      }

      const stmts = buildRestoreStockStatements(env.DB, parseOrderItems(order.items_json));
      await env.DB.batch(stmts);

      released++;
      console.log(`[releaseAbandoned] Orden ${order.id} cancelada por abandono; stock restaurado`);

      await sendOrderAutoCancelledEmail(env, {
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
      });
    } catch (err) {
      errors++;
      console.error(`[releaseAbandoned] Error liberando orden ${order.id}:`, err);
    }
  }

  return { processed: results.length, released, errors };
}
