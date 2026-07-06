import type { Order, BankConfig } from './types';

const ORDERS_KEY = 'orders';
const BANK_CONFIG_KEY = 'bank_config';

const defaultBankConfig: BankConfig = {
  bankName: 'Banco Ejemplo',
  cbu: '0000000000000000000000',
  alias: 'BLANQUERIA.TRANSFERENCIA',
  accountHolder: 'Blanquería S.A.',
};

export async function getOrders(kv: KVNamespace): Promise<Order[]> {
  const raw = await kv.get(ORDERS_KEY, 'text');
  return raw ? JSON.parse(raw) : [];
}

export async function saveOrders(kv: KVNamespace, orders: Order[]): Promise<void> {
  await kv.put(ORDERS_KEY, JSON.stringify(orders));
}

export async function addOrder(kv: KVNamespace, order: Order): Promise<Order> {
  const orders = await getOrders(kv);
  orders.unshift(order);
  await saveOrders(kv, orders);
  return order;
}

export async function updateOrderStatus(kv: KVNamespace, id: string, orderStatus: string): Promise<void> {
  const orders = await getOrders(kv);
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error('Order not found');
  orders[idx] = { ...orders[idx], orderStatus: orderStatus as Order['orderStatus'] };
  await saveOrders(kv, orders);
}

export async function getBankConfig(kv: KVNamespace): Promise<BankConfig> {
  const raw = await kv.get(BANK_CONFIG_KEY, 'text');
  return raw ? JSON.parse(raw) : defaultBankConfig;
}

export async function saveBankConfig(kv: KVNamespace, config: BankConfig): Promise<void> {
  await kv.put(BANK_CONFIG_KEY, JSON.stringify(config));
}
