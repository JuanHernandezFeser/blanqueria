import type { Env } from './types';
import { handleAuth } from './routes/auth';
import { handleProducts } from './routes/products';
import { handleCategories } from './routes/categories';
import { handleAmbientes } from './routes/ambientes';
import { handleHeroSlides } from './routes/hero-slides';
import { handleSpecials } from './routes/specials';
import { handleOrders } from './routes/orders';
import { handleBankConfig } from './routes/bank-config';
import { handleMercadoPago } from './routes/mercadopago';
import { handleUpload } from './routes/upload';
import { handleShipping } from './routes/shipping';
import { releaseAbandonedMpOrders } from './jobs/releaseAbandonedOrders';

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

async function handleRoute(request: Request, env: Env, ctx: ExecutionContext, path: string, method: string): Promise<Response> {
  if (path.startsWith('/api/auth/')) return handleAuth(request, env, ctx, path, method);
  if (path.startsWith('/api/products')) return handleProducts(request, env, ctx, path, method);
  if (path.startsWith('/api/categories')) return handleCategories(request, env, ctx, path, method);
  if (path.startsWith('/api/ambientes')) return handleAmbientes(request, env, ctx, path, method);
  if (path.startsWith('/api/hero-slides')) return handleHeroSlides(request, env, ctx, path, method);
  if (path.startsWith('/api/specials')) return handleSpecials(request, env, ctx, path, method);
  if (path.startsWith('/api/orders')) return handleOrders(request, env, ctx, path, method);
  if (path.startsWith('/api/bank-config')) return handleBankConfig(request, env, ctx, path, method);
  if (path === '/api/create-preference' || path === '/api/webhooks/mercadopago') return handleMercadoPago(request, env, ctx, path, method);
  if (path === '/api/upload') return handleUpload(request, env, ctx, path, method);
  if (path.startsWith('/api/shipping')) return handleShipping(request, env, ctx, path, method);
  if (path === '/api/health') return json({ status: 'ok', timestamp: new Date().toISOString() });

  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      return await handleRoute(request, env, ctx, path, method);
    } catch (err) {
      if (err instanceof Response) return err;
      const message = err instanceof Error ? err.message : 'Internal error';
      return json({ error: message }, 500);
    }
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      const result = await releaseAbandonedMpOrders(env);
      console.log(`[cron] releaseAbandonedMpOrders: ${JSON.stringify(result)}`);
    } catch (err) {
      console.error('[cron] releaseAbandonedMpOrders failed:', err);
    }
  },
};
