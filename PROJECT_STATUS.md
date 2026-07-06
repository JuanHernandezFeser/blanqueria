# Resumen del Proyecto Blanqueria / AIKEN

## 1. Estructura General de Carpetas

```
blanqueria/
├── src/                    # Frontend React (Vite)
│   ├── components/
│   │   ├── shared/         # Componentes reutilizables
│   │   └── ui/             # shadcn/ui primitives (50+)
│   ├── data/               # Tipos y datos de ejemplo
│   ├── hooks/              # Hooks personalizados
│   ├── lib/                # Utilidades (cn, helpers)
│   ├── pages/
│   │   └── admin/          # Sub-páginas del panel admin
│   ├── services/           # API client y servicios
│   ├── stores/             # Zustand stores
│   └── test/               # Tests Vitest
├── server/                 # Backend Bun + Hono
│   ├── data/               # Base SQLite (gitignored)
│   ├── dist/               # Compilado
│   ├── src/
│   │   └── routes/         # Rutas Hono (auth, products, etc.)
│   └── uploads/            # Archivos subidos (gitignored)
├── workers/
│   └── api/                # Cloudflare Worker (serverless alternativo)
│       └── src/
└── public/                 # Archivos estáticos
```

## 2. Stack y Versiones Principales

### Frontend (`package.json` raíz)

| Tecnología | Versión |
|---|---|
| React | ^18.3.1 |
| Vite | ^5.4.19 |
| TypeScript | ^5.8.3 |
| react-router-dom | ^6.30.1 |
| Zustand | ^5.0.11 |
| TanStack React Query | ^5.83.0 |
| Tailwind CSS | ^3.4.17 |
| shadcn/ui | (vía Radix primitives) |
| Framer Motion | ^12.36.0 |
| React Hook Form | ^7.61.1 |
| Zod | ^3.25.76 |
| Recharts | ^2.15.4 |
| Sonner (toast) | ^1.7.4 |
| Lucide (iconos) | ^0.462.0 |
| Vitest | ^3.2.4 |
| Playwright | ^1.57.0 |

### Backend (`server/package.json`)

| Tecnología | Versión |
|---|---|
| Bun | runtime |
| Hono | ^4.7.0 |
| SQLite | bun:sqlite (nativo) |
| Resend | API externa (emails) |

### Workers (`workers/api/package.json`)

| Tecnología | Versión |
|---|---|
| Wrangler | ^4.0.0 |
| Cloudflare Workers | runtime |

## 3. Funcionalidades ya Implementadas

### Frontend

| Funcionalidad | Descripción |
|---|---|
| **Landing page** (`/`) | Hero carousel con autoplay + categorías destacadas + carruseles de productos (nuevos/destacados) |
| **Catálogo** (`/catalogo`) | Búsqueda, filtros por categoría/subcategoría/marca/precio/stock, ordenamiento, panel lateral de producto |
| **Carrito** (`/carrito`) | Items con cantidad, calculadora de envío, resumen, persistencia Zustand con TTL 72h |
| **Checkout** (`/checkout`) | 3 pasos: datos de envío → método de pago (MP/transferencia) → confirmación. Compra como invitado |
| **Login/Registro** (`/login`, `/registro`) | Auth con JWT, registro con dirección completa |
| **Mi cuenta** (`/mi-cuenta`) | Perfil de usuario + historial de pedidos con estados |
| **Retorno de pago** (`/pago/retorno`) | Manejador post-MercadoPago: crea orden automáticamente, muestra resultado |
| **Panel Admin** (`/admin`) | 5 tabs: Productos (CRUD + stock por variante/color + imágenes múltiples), Categorías (con subcategorías), Hero Slides (CRUD + reorden), Pedidos (listado + cambio de estado), Medios de pago (config transferencia bancaria) |
| **Search autocomplete** | Búsqueda con dropdown de hasta 6 sugerencias con miniatura |
| **Shipping calculator** | Cálculo local de envío por código postal (CABA/GBA/resto Argentina) |
| **WhatsApp flotante** | Botón fijo con enlace a WhatsApp |
| **Responsive** | Mobile con menú hamburguesa, search toggle |
| **Breadcrumbs** | Navegación de migas de pan |

### Backend (Hono + SQLite)

| Funcionalidad | Descripción |
|---|---|
| **Auth** | Registro, login, perfil. JWT custom (HS256, Web Crypto API, 24h exp). bcrypt para passwords |
| **Productos CRUD** | Campos: nombre, descripción, marca, categoría, subcategoría, precio, stock simple o por variante/color, imágenes múltiples, flags featured/isNew |
| **Categorías CRUD** | Nombre, imagen, descripción, subcategorías (array JSON). Fallback de imagen desde productos |
| **Hero Slides CRUD** | Tipo image/product, imagen, título/subtítulo, link, orden. Reorden batch |
| **Órdenes** | Creación con items + dirección de envío, descuento de stock (variant-aware), listado filtrado por usuario, cambio de estado por admin |
| **Mercado Pago** | Proxy a API de MP para crear preferencias, webhook receiver, auto-return |
| **Transferencia bancaria** | Config singleton: banco, CBU, alias, titular. Lectura pública, escritura admin |
| **Emails** | Confirmación de orden vía Resend con HTML template (items, dirección, datos de transferencia). Degradación graceful si falta API key |
| **Subida de archivos** | Admin-only, validación de tipo (imágenes) y tamaño (10MB), filename UUID, servido estático |
| **Health check** | `GET /api/health` |
| **CORS** | Solo origins locales (8080, 5173) |

### Workers (Cloudflare)

- API serverless alternativa con Workers KV
- Endpoints: create-preference, webhooks, orders, bank-config
- Tipos TypeScript compartidos

## 4. Funcionalidades en Progreso o Incompletas

No se encontraron TODOs, FIXMEs ni código comentado en el código fuente. Sin embargo, por el historial de commits recientes, se identifican áreas que parecen haber sido añadidas recientemente y podrían requerir pulido:

| Área | Estado |
|---|---|
| **Stock por talle/color** | Implementado en backend (variant_stock_json) y frontend (selectores con stock awareness). Commits recientes (los últimos ~10) |
| **Subcategorías** | Agregadas recientemente en admin (crear/editar categorías con subcategorías, filtro en frontend) |
| **Imágenes múltiples y colores** | Soporte multi-imagen y colores por producto agregado recientemente (commits ~15-20 atrás) |
| **Mercado Pago en dev** | Simulación de pago aprobado en desarrollo (no es un bug, es intencional) |

## 5. Endpoints del Backend (Hono Routes)

| Método | Ruta | Auth | Admin | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/api/health` | - | - | Health check |
| `GET` | `/uploads/:file` | - | - | Servir archivos subidos |
| `POST` | `/api/auth/register` | - | - | Registrar usuario |
| `POST` | `/api/auth/login` | - | - | Login → JWT |
| `GET` | `/api/auth/me` | Sí | - | Perfil actual |
| `GET` | `/api/products` | - | - | Listar productos |
| `GET` | `/api/products/:id` | - | - | Producto por ID |
| `POST` | `/api/products` | Sí | Sí | Crear producto |
| `PUT` | `/api/products/:id` | Sí | Sí | Actualizar producto |
| `DELETE` | `/api/products/:id` | Sí | Sí | Eliminar producto |
| `GET` | `/api/categories` | - | - | Listar categorías |
| `POST` | `/api/categories` | Sí | Sí | Crear categoría |
| `PUT` | `/api/categories/:name` | Sí | Sí | Actualizar categoría |
| `DELETE` | `/api/categories/:name` | Sí | Sí | Eliminar categoría |
| `GET` | `/api/hero-slides` | - | - | Listar slides |
| `POST` | `/api/hero-slides` | Sí | Sí | Crear slide |
| `PUT` | `/api/hero-slides/:id` | Sí | Sí | Actualizar slide |
| `DELETE` | `/api/hero-slides/:id` | Sí | Sí | Eliminar slide |
| `POST` | `/api/hero-slides/reorder` | Sí | Sí | Reordenar slides |
| `GET` | `/api/orders` | Sí | - | Listar órdenes (propias o todas si admin) |
| `POST` | `/api/orders` | - | - | Crear orden (guest) |
| `PATCH` | `/api/orders/:id/status` | Sí | Sí | Cambiar estado |
| `GET` | `/api/bank-config` | - | - | Obtener config bancaria |
| `PUT` | `/api/bank-config` | Sí | Sí | Actualizar config bancaria |
| `POST` | `/api/create-preference` | - | - | Crear preferencia MP |
| `POST` | `/api/webhooks/mercadopago` | - | - | Webhook MP |
| `POST` | `/api/upload` | Sí | Sí | Subir imágenes |

## 6. TODOs / FIXMEs / Comentarios Pendientes

**No se encontraron** TODOs, FIXMEs, HACKs ni código comentado en ningún archivo fuente del proyecto. El código está limpio de marcadores de deuda técnica.

## 7. Últimos Commits (30 más recientes)

```
9ad4c1f Cambios algunos
576aef7 Aike agregado
9339b35 Implemented stock por talla/color
2efa9f3 Implemented per-size/color stock
e5515c2 Added per-combo stock support
e498ccc Added per-variant stock logic
cca4c30 Implemented per-size/color stock
b1b6552 Added variant stock support
820814f Added per-variant stock handling
684805c Implemented stock per size/color
f59b0ce Adjusted stock UI for variants
467594b Fixed admin crash on subcats
dc1e53e Fixed Admin crash on categories
09b0a2d Harden admin subcategory access
7edbc55 Added admin category subcats
7707da7 Habilitó subcategorías y admin
81680fd Enabled subcategory creation
7f7cb4c Agregó subcategorías y admin UI
a86d723 Added admin category subcreation
a41d903 Agregó subcategorías al crear categoría
18a642e Added subcategory input on create
a858d99 Added product multi-images & colors
1b72ae4 Added multi-image and colors
7c9a095 Implemented product colors & gallery
49d0729 Added multi-image uploads
1f724c1 Added toast close button
e76b761 Added close button to toasts
3614879 Bloqueó agregar sin tamaño
3021647 Fixed cart actions by variant
2d5258f Blocked adding without size and fixed cart removal
```

**Último commit:** `9ad4c1f` — 2026-03-27 — "Cambios algunos"

**Archivos modificados en últimos 5 commits:** `index.html`, `Footer.tsx`, `Navbar.tsx`, `ProductCard.tsx`, `ProductDetail.tsx`, `data/products.ts`, `Admin.tsx`, `Catalog.tsx`, `Home.tsx` (+308 líneas, -72).

## 8. Problemas Conocidos o Bugs Pendientes

| Problema | Estado |
|---|---|
| **Admin crash con subcategorías** | Fixeado en commits `467594b`, `dc1e53e`, `09b0a2d` |
| **Cart actions por variante** | Fixeado en `3021647` (acciones del carrito rotas al usar variantes) |
| **Bloquear agregar sin tamaño** | Fixeado en `3614879` (no se podía agregar al carrito sin seleccionar talle) |
| **Mercado Pago en producción** | No hay evidencia de que se haya probado con credenciales reales. En dev simula aprobación. |
| **JWT_SECRET hardcodeado** | El `.env.example` tiene `blanqueria-secret-key-change-in-production` — pendiente de cambiar en producción |
| **Sin tests de integración** | Solo hay un test de ejemplo en Vitest. No hay tests para la API ni E2E con Playwright (solo config presente) |
| **Base SQLite en producción** | SQLite no escala para múltiples instancias. El Worker de Cloudflare con KV sería la alternativa serverless, pero no está en uso activo |
| **Resend API key** | El `.env` actual tiene una key de Resend válida (`re_gmEzezHS_...`) — **riesgo de seguridad** si se sube a un repo público |
