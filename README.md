# Monstera

PWA para cuidar plantas de interior: calendario de riego y fertilización, diagnóstico con IA (Cursor) y recomendaciones con clima (Open-Meteo).

## Stack

- **Nuxt 3/4** + Vue 3 + Nuxt UI
- **Supabase** (Postgres, Auth magic link, Storage)
- **@cursor/sdk** en rutas Nitro (`server/api`)
- **@vite-pwa/nuxt**

## Configuración

1. Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Crea un proyecto en [Supabase](https://supabase.com) y aplica migraciones:

```bash
npx supabase link
npx supabase db push
```

3. Variables obligatorias (en **Project Settings → API** del dashboard):

| Variable en `.env` | Clave en Supabase | Uso |
|--------------------|-------------------|-----|
| `SUPABASE_URL` | Project URL | URL del proyecto |
| `SUPABASE_KEY` | **Publishable** (antes anon) | Cliente Nuxt, respeta RLS |
| `SUPABASE_SERVICE_KEY` | **Secret** (antes service_role) | Solo servidor (`server/api`) |
| `CURSOR_API_KEY` | — | API key de Cursor |

> La **Secret** key tiene permisos elevados: no la expongas en el frontend ni la subas a Git.

4. Opcional — notificaciones push:

```bash
npx web-push generate-vapid-keys
```

Añade `NUXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`. Para cron diario, configura `CRON_SECRET` y llama `POST /api/push/send-daily` con header `x-cron-secret`.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

Despliega en Vercel/Netlify/Cloudflare con las mismas variables de entorno.
