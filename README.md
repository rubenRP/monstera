# Monstera

PWA for caring for indoor plants: watering and fertilizing calendar, AI diagnosis (Cursor), and weather-based recommendations (Open-Meteo).

## Stack

- **Nuxt 3/4** + Vue 3 + Nuxt UI
- **Supabase** (Postgres, magic link auth, storage)
- **@cursor/sdk** on Nitro routes (`server/api`)
- **@vite-pwa/nuxt**

## Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Create a project on [Supabase](https://supabase.com) and apply migrations:

```bash
npx supabase link
npx supabase db push
```

3. Required variables (in **Project Settings → API** in the dashboard):

| `.env` variable | Supabase key | Purpose |
|-----------------|--------------|---------|
| `SUPABASE_URL` | Project URL | Project URL |
| `SUPABASE_KEY` | **Publishable** (formerly anon) | Nuxt client, respects RLS |
| `NUXT_SUPABASE_SECRET_KEY` | **Secret** (formerly service_role) | Server only (`server/api`) |
| `CURSOR_API_KEY` | — | Cursor API key |
| `PERENUAL_API_KEY` | — | Perenual API key (species variety tab) |

> The **Secret** key has elevated permissions: do not expose it in the frontend or commit it to Git.

4. Optional — push notifications:

```bash
npx web-push generate-vapid-keys
```

Add `NUXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. On Vercel, `vercel.json` triggers `GET /api/cron/send-daily` **four times per day** (00:00, 06:00, 12:00, 18:00 UTC). Vercel **Hobby only allows at-most-daily schedules**; hourly cron (`0 * * * *`) is rejected and will not appear in the dashboard. On **Pro**, you could replace those with a single `0 * * * *` entry for hourly checks. Each user receives at most one reminder per day at their chosen time (Ajustes → Notificaciones); default 09:00 in the device time zone. For manual tests, set `CRON_SECRET` and call `POST /api/push/send-daily` with the `x-cron-secret` header.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

Deploy to Vercel, Netlify, or Cloudflare with the same environment variables.
