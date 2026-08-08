# AIKEN / Blanqueria

E-commerce de blanquería y textil para el hogar: sábanas, toallas, almohadas, acolchados y manteles. Incluye catálogo, carrito, checkout con **Mercado Pago** o **transferencia bancaria**, registro de usuarios, historial de pedidos y panel de administración completo (productos, categorías, slides, pedidos, medios de pago y envíos).

**Frontend:** https://aikenblanco.com.ar · **API:** https://api.aikenblanco.com.ar

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (SPA) | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Zustand · React Router · TanStack Query |
| Backend local | Bun · Hono · SQLite (`bun:sqlite`) |
| API de producción | Cloudflare Workers + D1 (`blanqueria-api` / `blanqueria-db`) |
| Deploy | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| Pagos | Mercado Pago · Transferencia bancaria |
| Emails | Resend |
| Tests | Vitest · Playwright |

## Estructura

```
blanqueria/
├── src/               # Frontend React (Vite)
├── server/            # Backend Bun + Hono + SQLite (desarrollo local)
├── workers/api/       # Cloudflare Worker: API de producción + migraciones D1
├── functions/         # Pages Functions: proxy /api/* → Worker
├── public/            # Estáticos (logos, favicon)
├── docs/              # Documentación y guías de deploy
└── package.json       # Scripts del frontend
```

## Empezar

Requisitos: Node.js, npm y [Bun](https://bun.sh).

```sh
# Dependencias
npm install
cd server && bun install
cd workers/api && npm install

# Frontend + backend local juntos (proxy /api → :3001)
npm run dev:all
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server Vite en http://localhost:8080 |
| `npm run dev:server` | Backend Bun con watch (puerto 3001) |
| `npm run dev:all` | Frontend + backend juntos |
| `npm run build` | Build de producción a `dist/` |
| `npm run lint` | ESLint |
| `npm run test` | Tests Vitest |

### Worker (producción)

```sh
cd workers/api
npm run dev        # wrangler dev (worker + D1 local)
npm run deploy     # wrangler deploy (producción)
npm run db:init    # wrangler d1 execute --remote --file=schema.sql
npm run db:seed    # wrangler d1 execute --remote --file=seed.sql
```

## API

La interfaz de API es la misma en local y producción (definida en `server/` y `workers/api/`). Incluye auth con JWT, CRUD de productos/categorías/ambientes/slides, pedidos, cotización de envío (OCA), preferencias y webhooks de Mercado Pago, y subida de imágenes.

Endpoints completos en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md#5-api--endpoints).

## Base de datos

- **Local:** SQLite (`server/data/blanqueria.db`), schema en `server/src/db.ts`.
- **Producción:** Cloudflare D1 (`blanqueria-db`), schema base en `workers/api/schema.sql` + migraciones en `workers/api/migrations/`.

```sh
cd workers/api
npx wrangler d1 migrations apply blanqueria-db --remote
```

## Deploy

El flujo usa dos ramas: `local` (desarrollo) y `main` (producción).

```sh
# 1. Commit y push de la rama de trabajo
git add .
git commit -m "Descripcion del cambio"
git push origin local

# 2. Merge a main y push
git checkout main
git merge local
git push origin main
git checkout local

# 3. Deploy frontend (Cloudflare Pages)
npm run build
npx wrangler pages deploy dist

# 4. Deploy worker
cd workers/api
npx wrangler deploy

# 5. Migraciones D1 (si corresponde)
npx wrangler d1 migrations apply blanqueria-db --remote
```

Secrets del worker (`JWT_SECRET`, `RESEND_API_KEY`, `MERCADOPAGO_*`, `IMGBB_API_KEY`, etc.) se manejan con `wrangler secret put <NOMBRE>` o desde el dashboard de Cloudflare.

## Documentación

- [Documentación completa (Markdown)](docs/DOCUMENTACION.md) — arquitectura, endpoints, base de datos, migraciones, comandos y flujo Git.
- [Guía de deploy](docs/deploy-guide.md)
- [Documentación (PDF)](docs/DOCUMENTACION.pdf)

## Seguridad

- Nunca subir archivos `.env` ni secrets al repositorio (cubierto por `.gitignore`).
- El `JWT_SECRET` local del `.env.example` es solo para desarrollo; usar un valor fuerte en producción.
- La API de producción (`src/services/api.ts`) apunta fijo a `https://api.aikenblanco.com.ar/api`.
