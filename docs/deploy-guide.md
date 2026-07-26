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

## Paso 5: Deploy a Cloudflare Workers

```bash
cd workers/api
npx wrangler deploy
```

Verificar que aparezca el mensaje de `Uploaded` y `Deployed` sin errores.

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

# 4. Deploy
cd workers/api
npx wrangler deploy
```

---

## Notas importantes

- La rama `main` es la rama de produccion.
- El deploy usa Wrangler y publica el Worker en `blanqueria-api`.
- El dominio de produccion es `https://api.aikenblanco.com.ar`.
- Los secrets (JWT_SECRET, IMGBB_API_KEY, etc.) se manejan desde el dashboard de Cloudflare o con `wrangler secret put <NOMBRE>`.
- No commitear archivos `.env` ni secrets al repositorio.
