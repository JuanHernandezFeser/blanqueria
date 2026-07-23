import type { Env } from '../types';
import { requireAdmin } from '../auth';

interface BankConfigRow {
  id: number; bank_name: string; cbu: string; alias: string; account_holder: string; discount_percentage: number;
}

function formatConfig(row: BankConfigRow) {
  return { bankName: row.bank_name, cbu: row.cbu, alias: row.alias, accountHolder: row.account_holder, discountPercentage: row.discount_percentage || 0 };
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

export async function handleBankConfig(request: Request, env: Env, path: string, method: string): Promise<Response> {
  // GET /api/bank-config
  if (method === 'GET' && path === '/api/bank-config') {
    const row = await env.DB.prepare('SELECT * FROM bank_config WHERE id = 1').first<BankConfigRow>();
    if (!row) return json({ bankName: '', cbu: '', alias: '', accountHolder: '', discountPercentage: 0 });
    return json(formatConfig(row));
  }

  // PUT /api/bank-config
  if (method === 'PUT' && path === '/api/bank-config') {
    await requireAdmin(request, env);
    const body = await request.json() as any;
    await env.DB.prepare(
      'UPDATE bank_config SET bank_name = ?, cbu = ?, alias = ?, account_holder = ?, discount_percentage = ? WHERE id = 1'
    ).bind(body.bankName, body.cbu, body.alias, body.accountHolder, body.discountPercentage || 0).run();
    const row = await env.DB.prepare('SELECT * FROM bank_config WHERE id = 1').first<BankConfigRow>();
    return json(formatConfig(row!));
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
