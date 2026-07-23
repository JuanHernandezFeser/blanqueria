import type { Env } from './types';
import { handleAuth } from './routes/auth';
import { handleProducts } from './routes/products';
import { handleCategories } from './routes/categories';
import { handleAmbientes } from './routes/ambientes';
import { handleHeroSlides } from './routes/hero-slides';
import { handleOrders } from './routes/orders';
import { handleBankConfig } from './routes/bank-config';
import { handleMercadoPago } from './routes/mercadopago';
import { handleUpload } from './routes/upload';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleRoute(request: Request, env: Env, path: string, method: string): Promise<Response> {
  if (path.startsWith('/api/auth/')) return handleAuth(request, env, path, method);
  if (path.startsWith('/api/products')) return handleProducts(request, env, path, method);
  if (path.startsWith('/api/categories')) return handleCategories(request, env, path, method);
  if (path.startsWith('/api/ambientes')) return handleAmbientes(request, env, path, method);
  if (path.startsWith('/api/hero-slides')) return handleHeroSlides(request, env, path, method);
  if (path.startsWith('/api/orders')) return handleOrders(request, env, path, method);
  if (path.startsWith('/api/bank-config')) return handleBankConfig(request, env, path, method);
  if (path === '/api/create-preference' || path === '/api/webhooks/mercadopago') return handleMercadoPago(request, env, path, method);
  if (path === '/api/upload') return handleUpload(request, env, path, method);
  if (path === '/api/health') return json({ status: 'ok', timestamp: new Date().toISOString() });

  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      return await handleRoute(request, env, path, method);
    } catch (err) {
      if (err instanceof Response) return err;
      const message = err instanceof Error ? err.message : 'Internal error';
      return json({ error: message }, 500);
    }
  },
};
