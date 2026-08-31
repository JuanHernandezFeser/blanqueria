# Guia de Deploy a Produccion - Blanqueria

## Requisitos previos

- Git instalado y configurado
- Node.js instalado
- Wrangler instalado globalmente (`npm install -g wrangler`)
- Autenticado en Cloudflare (`wrangler login`)
- Permisos de escritura en el repositorio `JuanHernandezFeser/blanqueria`

---

## Paso 1: Verificar rama actual

```bash
git branch --show-current
```

Asegurate de estar trabajando en la rama `local`.

---

## Paso 2: Commitear los cambios

```bash
git add <archivos_modificados>
git commit -m "Descripcion clara del cambio"
```

Ejemplo:

```bash
git add workers/api/src/routes/upload.ts
git commit -m "Fix upload: chunked base64 encoding para evitar 502 en archivos grandes"
```

---

## Paso 3: Pushear la rama `local`

```bash
git push origin local
```

---

## Paso 4: Merge a `main` y push

```bash
git checkout main
git merge local
git push origin main
git checkout local
```

---

## Paso 5: Deploy frontend (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy dist --branch main
```

**IMPORTANTE:** siempre usar `--branch main`. El branch de produccion del proyecto
Pages `blanqueria-frontend` es `main` y el dominio custom `aikenblanco.com.ar` apunta
al deployment de **Production**. Si omitís `--branch` (o usás `--branch local` /
`--branch production`), `wrangler` crea un deploy de **PREVIEW** que NO actualiza
`aikenblanco.com.ar`, aunque el comando termine "exitosamente".

Verificar que el nuevo deployment quede en Environment **Production**:

```bash
npx wrangler pages deployment list --project-name blanqueria-frontend
```

---

## Paso 6: Deploy a Cloudflare Workers

```bash
cd workers/api
npx wrangler deploy
```

Verificar que aparezca el mensaje de `Uploaded` y `Deployed` sin errores.

---

## Paso 7: Migraciones D1 (si corresponde)

```bash
cd workers/api
npx wrangler d1 migrations apply blanqueria-db --remote
```

Si el comando falla con `table ... already exists`, es porque migraciones previas se
aplicaron a mano (p. ej. desde el dashboard) sin registrarse en la tabla `d1_migrations`.
Marca las ya aplicadas y volvé a correr el apply:

```bash
npx wrangler d1 execute blanqueria-db --remote --command "INSERT OR IGNORE INTO d1_migrations (id, name, applied_at) VALUES (4,'0004_micorreo_token_cache.sql',datetime('now')),(5,'0005_add_site_settings.sql',datetime('now')),(6,'0006_add_product_slug.sql',datetime('now'));"
npx wrangler d1 migrations apply blanqueria-db --remote
```

---

## Resumen rapido (copy-paste)

```bash
# 1. Commitear
git add .
git commit -m "Descripcion del cambio"

# 2. Push a local
git push origin local

# 3. Merge y push a main
git checkout main
git merge local
git push origin main
git checkout local

# 4. Deploy frontend (Pages)
npm run build
npx wrangler pages deploy dist --branch main

# 5. Deploy worker
cd workers/api
npx wrangler deploy

# 6. Migraciones D1 (si corresponde)
npx wrangler d1 migrations apply blanqueria-db --remote
git checkout local
```

---

## Notas importantes

- La rama `main` es la rama de produccion para git y para el branch de Pages.
- Si creas una migracion nueva en `workers/api/migrations/`, aplicala con el Paso 7.
- El deploy usa Wrangler y publica el Worker en `blanqueria-api`.
- El dominio de produccion es `https://api.aikenblanco.com.ar` (API) y `https://aikenblanco.com.ar` (frontend).
- Los secrets (JWT_SECRET, IMGBB_API_KEY, etc.) se manejan desde el dashboard de Cloudflare o con `wrangler secret put <NOMBRE>`.
- No commitear archivos `.env` ni secrets al repositorio.
