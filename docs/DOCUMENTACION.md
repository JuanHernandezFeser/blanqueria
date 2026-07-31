# Documentación del Proyecto — AIKEN / Blanqueria

> E-commerce de blanquería y textil para el hogar.

| | |
|---|---|
| **Frontend** | https://aikenblanco.com.ar |
| **API (Worker Cloudflare)** | https://api.aikenblanco.com.ar |
| **Repositorio** | https://github.com/JuanHernandezFeser/blanqueria.git |
| **Fecha** | 30/07/2026 |

---

## Índice

1. [Visión General y Arquitectura](#1-visión-general-y-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Rutas del Frontend](#4-rutas-del-frontend)
5. [API — Endpoints](#5-api--endpoints)
6. [Base de Datos](#6-base-de-datos)
7. [Variables de Entorno y Secrets](#7-variables-de-entorno-y-secrets)
8. [Comandos de Desarrollo](#8-comandos-de-desarrollo)
9. [Flujo Git y Ramas](#9-flujo-git-y-ramas)
10. [Deploy a Producción](#10-deploy-a-producción)
11. [Notas, Problemas Conocidos y Seguridad](#11-notas-problemas-conocidos-y-seguridad)
12. [Historial Reciente](#12-historial-reciente)

---

## 1. Visión General y Arquitectura

**AIKEN / Blanqueria** es una tienda online de artículos de blanquería y textil para el hogar (sábanas, toallas, almohadas, acolchados, manteles). Cuenta con catálogo, carrito de compras, checkout con **Mercado Pago** o **transferencia bancaria**, registro de usuarios, historial de pedidos y un panel de administración completo (productos, categorías, slides, pedidos y medios de pago).

### 1.1 Componentes del sistema

| Componente | Tecnología | Rol |
|---|---|---|
| Frontend (SPA) | React + Vite + TypeScript | Tienda, panel admin y experiencia de usuario. Se compila a estáticos (`dist/`) y se sirve en Cloudflare Pages. |
| Backend local | Bun + Hono + SQLite | API de desarrollo local (`server/`). Usa `bun:sqlite` con archivo `server/data/blanqueria.db`. |
| Worker Cloudflare | Cloudflare Workers + D1 | API de producción (`workers/api`). Se sirve en `api.aikenblanco.com.ar` y persiste en D1 (`blanqueria-db`). |
| Functions de Pages | Cloudflare Pages Functions | Proxy `/api/*` hacia el Worker (`functions/api/[[route]].ts`). |

### 1.2 Arquitectura

```
+---------------------+          +----------------------------+
|  Frontend React SPA |          |  Cloudflare Pages (CDN)    |
|  (aikenblanco.com)  |  ------> |  dist/ + functions proxy   |
+---------------------+          +-------------+--------------+
                                              |  /api/*  (Pages Functions)
                                              v
                             +----------------------------+
                             |  Worker: blanqueria-api    |
                             |  (api.aikenblanco.com.ar)  |
                             +-------------+--------------+
                                           | D1 binding (DB)
                                           v
                              +-------------------------+
                              |  D1: blanqueria-db      |
                              |  (SQLite en Cloudflare) |
                              +-------------------------+
```

> **Nota importante:** el cliente de la API en producción (`src/services/api.ts`) apunta fijo a `https://api.aikenblanco.com.ar/api`. En desarrollo, el proxy de Vite reenvía `/api` a `http://localhost:3001` (usado por `shippingService.ts`).

---

## 2. Stack Tecnológico

### 2.1 Frontend (`package.json` raíz)

| Tecnología | Versión | Uso |
|---|---|---|
| React | ^18.3.1 | UI |
| Vite | ^5.4.19 | Build / dev server (puerto 8080) |
| TypeScript | ^5.8.3 | Lenguaje |
| react-router-dom | ^6.30.1 | Ruteo |
| Zustand | ^5.0.11 | Estado global (carrito con TTL 72h, auth, stores de catálogo) |
| @tanstack/react-query | ^5.83.0 | Fetch y cache |
| Tailwind CSS | ^3.4.17 | Estilos |
| shadcn/ui | Radix primitives | Componentes (50+ primitives) |
| framer-motion | ^12.36.0 | Animaciones |
| react-hook-form + Zod | ^7.61.1 / ^3.25.76 | Formularios y validación |
| Recharts | ^2.15.4 | Gráficos |
| sonner | ^1.7.4 | Toasts |
| lucide-react | ^0.462.0 | Iconos |
| Vitest | ^3.2.4 | Tests unitarios |
| Playwright | ^1.57.0 | Tests E2E |
| embla-carousel-react | ^8.6.0 | Carruseles |

### 2.2 Backend local (`server/package.json`)

| Tecnología | Versión | Uso |
|---|---|---|
| Bun | runtime | Runtime + `bun:sqlite` |
| Hono | ^4.7.0 | Framework HTTP |
| SQLite | bun:sqlite nativo | Base de datos local |
| Resend | API externa | Emails transaccionales |
| bcrypt (Web Crypto) | nativo | Hash de contraseñas |

### 2.3 Worker Cloudflare (`workers/api/package.json`)

| Tecnología | Versión | Uso |
|---|---|---|
| Wrangler | ^4.0.0 | CLI de deploy / dev |
| Cloudflare Workers | runtime | API serverless |
| Cloudflare D1 | SQLite serverless | Persistencia (binding `DB`) |
| @cloudflare/workers-types | ^4.20250301.0 | Tipos |

---

## 3. Estructura de Carpetas

```
blanqueria/
├── src/                      # Frontend React (Vite)
│   ├── components/           # Componentes
│   │   ├── shared/           # Reutilizables (carruseles, breadcrumbs, autocomplete…)
│   │   └── ui/               # Primitivas shadcn/ui (50+)
│   ├── data/                 # Tipos y datos (Product, categories, initialProducts)
│   ├── hooks/                # Hooks personalizados (use-mobile…)
│   ├── lib/                  # Utilidades (cn, helpers)
│   ├── pages/                # Páginas de la app
│   │   └── admin/            # Sub-páginas del panel admin
│   ├── services/             # Cliente de API y servicios (api, shippingService)
│   ├── stores/               # Stores Zustand (cart, auth, product, category…)
│   └── test/                 # Tests (Vitest + E2E Playwright)
├── server/                   # Backend Bun + Hono (dev local)
│   ├── data/                 # Base SQLite (gitignored: blanqueria.db)
│   ├── dist/                 # Compilado
│   ├── src/
│   │   ├── routes/           # Rutas Hono (auth, products, orders…)
│   │   ├── db.ts             # Schema + migraciones idempotentes (runSilent)
│   │   └── index.ts          # Bootstrap + CORS + /uploads
│   └── uploads/              # Archivos subidos (gitignored)
├── workers/
│   └── api/                  # Cloudflare Worker (API de producción)
│       ├── migrations/       # Migraciones D1 (0001_add_product_dimensions.sql)
│       ├── schema.sql        # Esquema base D1
│       ├── seed.sql          # Seed D1
│       ├── wrangler.toml     # Config worker + binding D1
│       └── src/
│           ├── index.ts      # Router
│           └── routes/       # Rutas del worker
├── functions/
│   └── api/[[route]].ts      # Pages Functions: proxy /api/* → worker
├── public/                   # Estáticos (logos, favicon)
├── imagenes-productos/       # Imágenes de productos
├── docs/                     # Guías y documentación
├── package.json              # Scripts del frontend
├── vite.config.ts            # Dev server (8080) + proxy /api → 3001
└── migration.sql             # Datos/migración SQLite local
```

### 3.1 Stores Zustand

| Store | Archivo | Contenido |
|---|---|---|
| cartStore | `src/stores/cartStore.ts` | Items del carrito (persistido, TTL 72h) |
| authStore | `src/stores/authStore.ts` | Sesión JWT y perfil |
| productStore | `src/stores/productStore.ts` | Catálogo de productos |
| categoryStore | `src/stores/categoryStore.ts` | Categorías y subcategorías |
| ambienteStore | `src/stores/ambienteStore.ts` | Ambientes |
| heroStore | `src/stores/heroStore.ts` | Slides del hero |
| orderStore | `src/stores/orderStore.ts` | Pedidos del usuario |
| bankConfigStore | `src/stores/bankConfigStore.ts` | Config de transferencia |

---

## 4. Rutas del Frontend

Definidas en `src/App.tsx` (React Router v6).

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | Home | Landing: hero carousel, categorías destacadas, carruseles de productos nuevos/destacados |
| `/catalogo` | Catalog | Búsqueda, filtros (categoría/subcategoría/marca/precio/stock), ordenamiento, panel lateral de producto |
| `/producto/:id` | ProductDetail | Detalle de producto (galería, variantes, colores, stock) |
| `/carrito` | Cart | Carrito + calculadora de envío + resumen |
| `/checkout` | Checkout | 3 pasos: envío → pago (MP/transferencia) → confirmación |
| `/pago/retorno` | PaymentReturn | Retorno post-MercadoPago (crea la orden y muestra resultado) |
| `/login` | Login | Inicio de sesión |
| `/registro` | Register | Registro de usuario |
| `/mi-cuenta` | MyAccount | Perfil + historial de pedidos |
| `/completar-perfil` | CompleteProfile | Completar datos de usuario |
| `/verificar-email/:token` | VerifyEmail | Verificación de email |
| `/admin` | Admin | Panel de administración (tabs: Productos, Categorías, Hero, Pedidos, Pagos, Ambientes) |
| `/faq` | FAQ | Preguntas frecuentes |
| `*` | NotFound | 404 |

---

## 5. API — Endpoints

Existen **dos implementaciones** del backend con la misma interfaz. La de producción es el Worker de Cloudflare (`workers/api`); la local (`server/`, Bun + Hono) se usa para desarrollo.

| Método | Ruta | Auth | Admin | Descripción |
|---|---|---|---|---|
| GET | `/api/health` | - | - | Health check |
| POST | `/api/auth/register` | - | - | Registrar usuario |
| POST | `/api/auth/login` | - | - | Login → JWT |
| GET | `/api/auth/me` | Sí | - | Perfil actual |
| PUT | `/api/auth/profile` | Sí | - | Actualizar perfil |
| POST | `/api/auth/verify-email` / `/resend-verification` | - | - | Verificación de email |
| GET | `/api/products` | - | - | Listar productos |
| GET | `/api/products/:id` | - | - | Producto por ID |
| POST | `/api/products` | Sí | Sí | Crear producto |
| PUT | `/api/products/:id` | Sí | Sí | Actualizar producto (incluye weight/width/height/length) |
| DELETE | `/api/products/:id` | Sí | Sí | Eliminar producto |
| GET/POST/PUT/DELETE | `/api/categories`… | Sí* | Sí | CRUD categorías (subcategorías en JSON) |
| GET/POST/PUT/DELETE | `/api/ambientes`… | Sí* | Sí | CRUD ambientes |
| GET/POST/PUT/DELETE | `/api/hero-slides`… | Sí* | Sí | CRUD slides del hero |
| POST | `/api/hero-slides/reorder` | Sí | Sí | Reordenar slides (batch) |
| GET | `/api/orders` | Sí | - | Listar órdenes (propias, o todas si admin) |
| POST | `/api/orders` | - | - | Crear orden (guest) |
| PATCH | `/api/orders/:id/status` | Sí | Sí | Cambiar estado de pedido |
| GET/PUT | `/api/bank-config` | Sí* | Sí | Config transferencia bancaria (GET público) |
| POST | `/api/create-preference` | - | - | Crear preferencia Mercado Pago |
| POST | `/api/webhooks/mercadopago` | - | - | Webhook MP |
| POST | `/api/upload` | Sí | Sí | Subir imágenes (max 10MB, admin) |
| POST | `/api/shipping/quote` | - | - | Cotizar envío (paquetes con weight/width/height/length) |
| GET | `/uploads/:file` | - | - | Servir archivos (solo backend local) |
| POST | `/api/testing/reset` | - | - | Reset de datos de prueba (solo dev, backend local) |

\* Los métodos de escritura requieren rol admin; los GET de lectura son públicos. La autenticación se envía como header `Authorization: Bearer <JWT>`.

### 5.1 Campos del producto relevantes para envío

El producto soporta **peso, alto, ancho y largo** (`weight`, `height`, `width`, `length`), editables desde el panel admin. Se usan en `buildShipmentPackages()` (`src/services/shippingService.ts`) con valores por defecto 1 kg y 20×20×20 cm.

---

## 6. Base de Datos

### 6.1 Dos motores

| | Local (dev) | Producción |
|---|---|---|
| Motor | SQLite vía `bun:sqlite` | Cloudflare D1 |
| Ubicación | `server/data/blanqueria.db` | D1 `blanqueria-db` (id `f0b2dc3d-a6b2-4174-ae9c-1750eef96eee`) |
| Schema | `server/src/db.ts` (migraciones idempotentes con `runSilent`) | `workers/api/schema.sql` (base) + `workers/api/migrations/` |
| Seed | `server/src/seed.ts` | `workers/api/seed.sql` |

### 6.2 Tabla `products`

| Columna | Tipo | Descripción |
|---|---|---|
| id | TEXT PK | Identificador (timestamp) |
| name | TEXT | Nombre |
| description | TEXT | Descripción |
| brand | TEXT | Marca |
| category | TEXT | Categoría |
| subcategory | TEXT | Subcategoría |
| price | REAL | Precio |
| stock | INTEGER | Stock simple |
| image | TEXT | Imagen principal |
| images_json | TEXT | Galería (array JSON) |
| variants_json | TEXT | Variantes/talles (array JSON) |
| colors_json | TEXT | Colores (array JSON) |
| variant_stock_json | TEXT | Stock por variante/color (objeto JSON) |
| ambientes_json | TEXT | Ambientes (array JSON) |
| **weight** | REAL | Peso (kg) — para envío |
| **width** | REAL | Ancho (cm) — para envío |
| **height** | REAL | Alto (cm) — para envío |
| **length** | REAL | Largo (cm) — para envío |
| featured | INTEGER | Destacado (0/1) |
| is_new | INTEGER | Nuevo (0/1) |
| created_at / updated_at | TEXT | Fechas |

### 6.3 Otras tablas

| Tabla | Columnas principales |
|---|---|
| users | email, password_hash, name, is_admin, phone, address, locality, province, postal_code, email_verified, verification_token |
| categories | name, image, description, subcategories_json, icon |
| ambientes | name, image, description |
| hero_slides | type, image, product_id, title, subtitle, link, order, video_url |
| orders | customer_name/email, date, subtotal, shipping_cost, total, order_status, payment_method, payment_status, items_json, shipping_address_json, source |
| bank_config | bank_name, cbu, alias, account_holder, discount_percentage |
| d1_migrations | Solo en D1: control de migraciones aplicadas (name, applied_at) |

### 6.4 Sistema de migraciones D1

Configurado en `workers/api/wrangler.toml` con `migrations_dir = "migrations"`. Cada cambio de schema se agrega como un archivo numerado:

| Migración | Contenido |
|---|---|
| `0001_add_product_dimensions.sql` | Agrega `weight`, `width`, `height`, `length` a `products` |

> **Atención:** en la D1 de producción la migración 0001 ya está aplicada manualmente y registrada en `d1_migrations`. `schema.sql` es la línea base sin esas columnas; no incluye `ALTER TABLE` porque D1 no los agrega a tablas existentes.

---

## 7. Variables de Entorno y Secrets

### 7.1 Backend local — `server/.env`

| Variable | Ejemplo | Descripción |
|---|---|---|
| PORT | 3001 | Puerto del server Hono |
| JWT_SECRET | blanqueria-secret-key-change-in-production | Secreto JWT (HS256) |
| DB_PATH | ./data/blanqueria.db | Ruta de la SQLite local |
| MERCADOPAGO_ACCESS_TOKEN | | Access token de Mercado Pago |
| MERCADOPAGO_PUBLIC_KEY | | Public key de Mercado Pago |
| MERCADOPAGO_WEBHOOK_SECRET | | Secreto del webhook |
| SITE_URL | http://localhost:8080 | URL del sitio (links en emails) |
| RESEND_API_KEY | | Key de Resend para emails |
| EMAIL_FROM | onboarding@resend.dev | Remitente de emails |
| TEST_RESET_KEY | dev-reset-key | Key del endpoint de reset (solo dev) |

### 7.2 Secrets del Worker — `wrangler secret put <NOMBRE>`

Se setean desde el dashboard de Cloudflare o con wrangler (carpeta `workers/api`):

```bash
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put MERCADOPAGO_ACCESS_TOKEN
wrangler secret put MERCADOPAGO_PUBLIC_KEY
wrangler secret put MERCADOPAGO_WEBHOOK_SECRET
wrangler secret put IMGBB_API_KEY
wrangler secret put MICORREO_CUSTOMER_ID
wrangler secret put MICORREO_EMAIL
wrangler secret put MICORREO_PASSWORD
```

### 7.3 Vars del Worker — `wrangler.toml` [vars]

| Variable | Valor |
|---|---|
| SITE_URL | https://aikenblanco.com.ar |
| EMAIL_FROM | tienda@aikenblanco.com.ar |

---

## 8. Comandos de Desarrollo

### 8.1 Instalación

```bash
npm install          # dependencias del frontend (raíz)
cd server && bun install
cd workers/api && npm install
```

### 8.2 Frontend (raíz)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server Vite en http://localhost:8080 (proxy `/api` → :3001) |
| `npm run dev:server` | Backend Bun con watch (`server/src/index.ts`) |
| `npm run dev:all` | Frontend + backend juntos (concurrently) |
| `npm run build` | Build de producción a `dist/` |
| `npm run build:dev` | Build en modo development |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run preview` | Previsualiza el build local |
| `npm run test` / `test:watch` | Tests Vitest |

### 8.3 Backend local

```bash
cd server
bun dev          # bun --watch src/index.ts  (puerto 3001)
bun start        # bun src/index.ts
```

### 8.4 Worker Cloudflare

```bash
cd workers/api
npm run dev            # wrangler dev (worker local con D1 local)
npm run deploy         # wrangler deploy (producción)
npm run db:init        # wrangler d1 execute --remote --file=schema.sql
npm run db:seed        # wrangler d1 execute --remote --file=seed.sql
```

### 8.5 Tests

- **Unitarios (Vitest):** `npm run test` — `src/test/`
- **E2E (Playwright):** `npx playwright test` — `src/test/e2e/checkout-transferencia.spec.ts` (config en `playwright.config.ts`)

---

## 9. Flujo Git y Ramas

Hay dos ramas principales:

| Rama | Rol |
|---|---|
| `local` | Rama de trabajo/desarrollo (activa por defecto) |
| `main` | Rama de producción |

Remote: `origin` → https://github.com/JuanHernandezFeser/blanqueria.git

### 9.1 Comandos habituales

```bash
# Estado y log
git branch --show-current
git status
git log --oneline -10

# Trabajar en local
git add <archivos>
git commit -m "Descripcion clara del cambio"
git push origin local

# Pasar a producción
git checkout main
git merge local
git push origin main
git checkout local
```

---

## 10. Deploy a Producción

### 10.1 Frontend — Cloudflare Pages

El frontend se compila con Vite y se sube a Cloudflare Pages (dominio `aikenblanco.com.ar`). La carpeta `functions/` incluye un proxy que reenvía `/api/*` al Worker.

```bash
# 1. Compilar el frontend (genera dist/)
npm run build

# 2. Subir a Cloudflare Pages
npx wrangler pages deploy dist
```

> Si Pages está conectado al repo por integración de GitHub, el deploy puede ser automático al pushear a `main`. El comando anterior es la vía manual.

### 10.2 Worker — Cloudflare Workers

```bash
cd workers/api
npx wrangler deploy
```

Publica el worker `blanqueria-api` en `https://api.aikenblanco.com.ar`. Verificar que aparezca `Uploaded` y `Deployed` sin errores.

### 10.3 Base de datos — D1

```bash
cd workers/api

# Aplicar migraciones pendientes (producción)
npx wrangler d1 migrations apply blanqueria-db --remote

# Inicializar schema base (solo DB nueva)
npm run db:init

# Sembrar datos iniciales (solo DB nueva)
npm run db:seed

# Inspección rápida
npx wrangler d1 execute blanqueria-db --remote --command "SELECT name FROM pragma_table_info('products');"
```

### 10.4 Secrets (si cambiaron)

```bash
cd workers/api
wrangler secret put NOMBRE_DEL_SECRET
```

### 10.5 Deploy completo (copy-paste)

```bash
# 1. Verificar rama de trabajo
git branch --show-current        # debe decir: local

# 2. Commit y push de la rama local
git add .
git commit -m "Descripcion clara del cambio"
git push origin local

# 3. Merge a main y push
git checkout main
git merge local
git push origin main
git checkout local

# 4. Deploy frontend (Pages)
npm run build
npx wrangler pages deploy dist

# 5. Deploy worker
cd workers/api
npx wrangler deploy

# 6. Aplicar migraciones D1 (si corresponde)
npx wrangler d1 migrations apply blanqueria-db --remote
```

---

## 11. Notas, Problemas Conocidos y Seguridad

| Tema | Estado |
|---|---|
| JWT_SECRET hardcodeado en `.env.example` (local) | Pendiente: usar un valor fuerte en producción |
| Mercado Pago en dev | En desarrollo simula pago aprobado (intencional) |
| Mercado Pago en producción | Requiere credenciales reales probadas |
| API client hardcodeado | `src/services/api.ts` apunta fijo a producción; en dev no se puede apuntar a local sin editarlo |
| Base de datos | SQLite local no escala a múltiples instancias; en producción se usa D1 (serverless) |
| Secrets | Nunca commitear `.env` ni keys al repo (ya cubierto por `.gitignore`) |
| Migraciones D1 | Los cambios de schema se hacen con migraciones (0001 ya aplicada en producción) |
| Tests | Solo hay unit tests de ejemplo y una suite E2E de checkout |

> **Advertencia de seguridad:** no subir `.env`, keys de Resend/MercadoPago ni secrets al repositorio o a repos públicos.

---

## 12. Historial Reciente

```
ea9a980 Mail de aviso interno al recibir pedido nuevo + FAQ en navbar
76a54b9 commit all local changes
2fc4d48 Agregar guia de deploy en markdown y PDF
02d5cfb Fix upload: chunked base64 encoding para evitar 502 en archivos grandes
df26f68 Quitar accesos demo, logo MP oficial, fix pedidos en produccion, actualizar dominios
9048a26 Completar suite E2E de checkout: 28 tests, fixes de validacion
f738f0e Agregar tests E2E de checkout, validación de email/telefono
11c036c Agregar backend Hono, workers Cloudflare y nuevas features de frontend
d6da991 Agregar .env al gitignore
```

### 12.1 Cambios recientes de infraestructura

- **2026-07-30** — Configurado sistema de migraciones D1 (`migrations_dir`) y migración `0001_add_product_dimensions.sql`. Agregadas las columnas `weight`, `width`, `height`, `length` a la tabla `products` de la D1 de producción.
