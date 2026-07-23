import { Hono } from 'hono';
import { getDb } from '../db';
import { authMiddleware, adminMiddleware } from '../auth';

const bankConfig = new Hono();

interface BankConfigRow {
  id: number; bank_name: string; cbu: string; alias: string; account_holder: string; discount_percentage: number;
}

function formatConfig(row: BankConfigRow) {
  return { bankName: row.bank_name, cbu: row.cbu, alias: row.alias, accountHolder: row.account_holder, discountPercentage: row.discount_percentage || 0 };
}

bankConfig.get('/', (c) => {
  const db = getDb();
  const row = db.query('SELECT * FROM bank_config WHERE id = 1').get() as BankConfigRow | undefined;
  if (!row) return c.json({ bankName: '', cbu: '', alias: '', accountHolder: '', discountPercentage: 0 });
  return c.json(formatConfig(row));
});

bankConfig.put('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  db.run('UPDATE bank_config SET bank_name = ?, cbu = ?, alias = ?, account_holder = ?, discount_percentage = ? WHERE id = 1',
    body.bankName, body.cbu, body.alias, body.accountHolder, body.discountPercentage || 0);
  const row = db.query('SELECT * FROM bank_config WHERE id = 1').get() as BankConfigRow;
  return c.json(formatConfig(row));
});

export default bankConfig;
