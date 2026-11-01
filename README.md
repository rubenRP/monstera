# Monstera

PWA for caring for indoor plants: watering and fertilizing calendar, AI diagnosis (Cursor), and weather-based recommendations ([Open-Meteo](https://open-meteo.com/), no API key).

**Self-hosting:** see [docs/self-hosting.md](docs/self-hosting.md) for Supabase setup, environment variables, cron jobs, and production auth.

## Stack

- **Nuxt 4** + Vue 3 + Nuxt UI
- **Clerk** (authentication)
- **Supabase** (Postgres, storage; validates Clerk's JWT via RLS)
- **@cursor/sdk** on Nitro routes (`server/api`) — optional
- **@vite-pwa/nuxt**

## Quick start

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Create a project on [Supabase](https://supabase.com) and apply migrations:

```bash
npx supabase link
npx supabase db push
```

3. Configure environment variables (from **Project Settings → API**):

### Required

| `.env` variable | Supabase key | Purpose |
|-----------------|--------------|---------|
| `SUPABASE_URL` | Project URL | API endpoint |
| `SUPABASE_KEY` | **Publishable** (anon) | Client; respects RLS |
| `NUXT_SUPABASE_SECRET_KEY` | **Secret** (service_role) | Server only (`server/api`) |

> The **Secret** key has elevated permissions: do not expose it in the frontend or commit it to Git.

| `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Login unavailable (dev: keyless mode) |
| `NUXT_CLERK_SECRET_KEY` | Clerk secret key (server only) | API routes cannot verify sessions |

### Clerk (login)

Login is handled by [Clerk](https://clerk.com); Supabase only stores data and validates Clerk's JWT (third-party auth).

1. Create a Clerk application and enable **Email** sign-in with *Email verification code*.
2. Clerk dashboard → **Integrations → Supabase** → activate. It adds the `role: authenticated` claim to session tokens.
3. Supabase dashboard → **Authentication → Sign In / Up → Third-Party Auth → Add → Clerk** and paste your Clerk domain (`xxx.clerk.accounts.dev`). For local `supabase start`, set `[auth.third_party.clerk]` in `supabase/config.toml`.
4. Set `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NUXT_CLERK_SECRET_KEY` (Clerk → API keys). Add your production domain to Clerk's allowed origins.

Migrating from the old Supabase magic-link login? After `db push` and a first sign-in with Clerk, move your data with
`node --env-file=.env scripts/migrate-user-to-clerk.mjs --clerk-id user_xxx` (dry run; add `--apply` to execute).

### Optional

| Variable | Purpose | If missing |
|----------|---------|------------|
| `CURSOR_API_KEY` | AI diagnosis and recommendations | Those features return 503 |
| `PERENUAL_API_KEY` | Species variety tab | Species tab returns 503 |
| `NUXT_PUBLIC_HOME_LAT` / `NUXT_PUBLIC_HOME_LON` | Default weather location | Defaults to Madrid coordinates |
| `NUXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push | Push disabled |
| `CRON_SECRET` | Authorize cron endpoints (Vercel and self-host) | Cron returns 403 |

Weather and exterior watering recalculation use **Open-Meteo** (free, no configuration).

Core plant care (plants, sites, calendar, photos) works with **Supabase only**.

## Development

Requires **Node.js 22**.

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
node .output/server/index.mjs
```

Or `npm run preview` for a local check.

Deploy on Vercel, a VPS, or any Node 22 host with the same environment variables. For non-Vercel hosts, scheduled jobs are documented in [docs/self-hosting.md](docs/self-hosting.md).

### Scheduled jobs

[`vercel.json`](vercel.json) triggers:

| Endpoint | Schedule (UTC) | Purpose |
|----------|----------------|---------|
| `GET /api/cron/send-daily` | Daily 09:00 | Push reminders |
| `GET /api/cron/recalculate-watering` | Sundays, midnight | Exterior watering from weather |

Set `CRON_SECRET` in production. Vercel cron sends `Authorization: Bearer <CRON_SECRET>`; endpoints also accept `x-cron-secret`. The `x-vercel-cron` header alone is not accepted.

```bash
npx web-push generate-vapid-keys   # optional, for push
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Architecture overview: [docs/architecture.md](docs/architecture.md).

## License

[MIT](LICENSE)
