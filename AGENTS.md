# Monstera — agent guide

Indoor plant care PWA (watering/fertilizing calendar, AI diagnosis, weather recommendations, species profiles). **User-facing UI copy** lives in [`i18n/locales/es.json`](i18n/locales/es.json) and [`i18n/locales/en.json`](i18n/locales/en.json) — add or update both languages when changing strings. API errors use codes in [`shared/utils/i18n/apiErrors.ts`](shared/utils/i18n/apiErrors.ts); translate on the client with `useApiError()`.

## Before you code

1. Read the rules in [`.cursor/rules/`](.cursor/rules/) (applied automatically in Cursor).
2. Run `npm install` and copy `.env` from [`.env.example`](.env.example) if needed.
3. After substantial changes: `npm run lint` and `npm run typecheck` (CI uses **pnpm**; same outcome).

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 4, Vue 3, Nuxt UI 4, Tailwind 4, `@nuxtjs/i18n` (es/en) |
| Backend | Nitro (`server/api`, `server/utils`) |
| Data | Supabase (Postgres + magic link auth + Storage + RLS) |
| AI | `@cursor/sdk` on Nitro routes (`/api/diagnose`, `/api/recommend`) |
| Species | Perenual API + cache in `species_profiles` |
| PWA | `@vite-pwa/nuxt`, optional Web Push |

## Repository layout

```
app/                    # Nuxt UI (pages, components, composables, layouts)
server/
  api/                  # Nitro HTTP routes (*.post.ts, *.get.ts)
  utils/                # Supabase service, Perenual, weather
shared/                 # Client/server shared code (#shared alias)
  types/                # Domain types (database.ts, species.ts)
  utils/                # Pure logic: care, plants, species, cursor prompts
  constants/            # Labels and sort orders (Spanish user strings)
supabase/migrations/    # Postgres schema (source of truth for the model)
public/                 # Static assets, push service worker
```

**Alias:** `#shared` → `shared/` (defined in `nuxt.config.ts`).

## Architecture

```mermaid
flowchart TB
  subgraph client [Nuxt client]
    Pages[app/pages]
    Composables[app/composables]
    Pages --> Composables
  end

  subgraph data [Supabase]
    DB[(Postgres + RLS)]
    Storage[(plant-photos)]
    Auth[Auth magic link]
  end

  subgraph server [Nitro server/api]
    Diagnose[/api/diagnose]
    Recommend[/api/recommend]
    Species[/api/plants/id/species-profile]
    Push[/api/push/*]
  end

  subgraph external [External]
    Cursor[Cursor API]
    Perenual[Perenual API]
    OpenMeteo[Open-Meteo]
  end

  Composables -->|anon key + RLS| DB
  Composables --> Storage
  Composables --> Auth
  Composables -->|Bearer JWT| server
  Diagnose --> Cursor
  Recommend --> Cursor
  Recommend --> OpenMeteo
  Species --> Perenual
  server -->|service key| DB
```

## Domain model (summary)

| Entity | Table | Notes |
|--------|-------|--------|
| **Plant** | `plants` | Optional `site`; watering/fertilizing intervals; `health_status` |
| **Site** | `sites` | Shared location (placement, orientation, luminosity) |
| **CareTask** | `care_tasks` | `water` / `fertilize`; `pending` / `done` / `skipped` |
| **Diagnosis** | `diagnoses` | AI diagnosis history |
| **SpeciesProfile** | `species_profiles` | Global cache by `species_query` (Perenual JSON) |
| **UserSettings** | `user_settings` | Home coordinates for weather |

Canonical TypeScript types: [`shared/types/database.ts`](shared/types/database.ts).  
Form/API validation: Zod schemas in [`shared/utils/plants/schemas.ts`](shared/utils/plants/schemas.ts) and [`shared/utils/sites/schemas.ts`](shared/utils/sites/schemas.ts).

### Care logic

- Task generation: [`shared/utils/care/generateTasks.ts`](shared/utils/care/generateTasks.ts)
- Overlapping task deduplication: [`shared/utils/care/deduplicateTasks.ts`](shared/utils/care/deduplicateTasks.ts)
- Watering plan (skip / adjust interval): [`shared/utils/care/wateringPlan.ts`](shared/utils/care/wateringPlan.ts)
- Client orchestration: [`app/composables/useCareTasks.ts`](app/composables/useCareTasks.ts)

## Required patterns

### Composables (`app/composables/use*.ts`)

- Export `function useXxx()` returning async methods and helpers.
- Data access: `useSupabaseClient()` + `useSupabaseUser()` (respects RLS).
- Throw Supabase `error`; do not swallow exceptions.

### Server routes (`server/api/**`)

- Secrets only via `useRuntimeConfig()` (`cursorApiKey`, `supabaseServiceKey`, `perenualApiKey`).
- Elevated client: `getServiceSupabase()` in [`server/utils/supabase.ts`](server/utils/supabase.ts).
- Routes touching user data: validate `Authorization: Bearer <access_token>` with `supabase.auth.getUser(token)` and filter by `user_id`.
- Validate body with Zod (`safeParse` → `createError` 400).
- AI: prompts in [`shared/utils/cursor/prompts.ts`](shared/utils/cursor/prompts.ts); client wrapper in [`app/composables/useAiApi.ts`](app/composables/useAiApi.ts).

### Vue components

- `<script setup lang="ts">`, Composition API.
- UI: **Nuxt UI** components (`UButton`, `UCard`, `UModal`, etc.).
- App colors: `primary: green` in [`app/app.config.ts`](app/app.config.ts).
- Auth pages: `definePageMeta({ layout: false })` on login/confirm.

### `shared/`

- No Vue/Nuxt imports; pure functions and reusable types.
- User-facing labels in Spanish: [`shared/constants/plants.ts`](shared/constants/plants.ts), [`shared/constants/sites.ts`](shared/constants/sites.ts).

## Where to implement changes

| Goal | Location |
|------|----------|
| New screen | `app/pages/...` |
| Reusable UI | `app/components/<domain>/` |
| Client state / CRUD | `app/composables/use*.ts` |
| HTTP endpoint | `server/api/<name>.<method>.ts` |
| Server external integration | `server/utils/` |
| Shared business rule | `shared/utils/<domain>/` |
| New column/table | `supabase/migrations/<timestamp>_<description>.sql` + update `shared/types/database.ts` |

## Environment variables

See [`.env.example`](.env.example). Critical rules:

- **`SUPABASE_KEY`** / **`NUXT_PUBLIC_SUPABASE_KEY`**: publishable (client). **`NUXT_SUPABASE_SECRET_KEY`**: server only, never in the bundle.
- **Do not** add a `SUPABASE_DB` variable — it breaks `supabase db push`.
- `CURSOR_API_KEY`, `PERENUAL_API_KEY` are server-only (`runtimeConfig`).

## Commands

```bash
npm run dev          # development
npm run build        # production build
npm run lint         # ESLint (@nuxt/eslint, no trailing comma)
npm run typecheck    # vue-tsc via nuxt typecheck
npx supabase db push # apply migrations
```

## Code style

- ESLint: `commaDangle: 'never'`, `braceStyle: '1tbs'`.
- Strict TypeScript; prefer `#shared/types` over `any`.
- User-facing error/API messages in **Spanish**.
- Minimal, focused changes; do not refactor unrelated files.

## Security

- Do not commit `.env` or secrets.
- RLS on all user tables; `species_profiles` is read-only for `authenticated`.
- Photos in private bucket `plant-photos`; signed URLs on the client.
- Push cron: `x-cron-secret` header when `CRON_SECRET` is set.

## Cursor rules (detail by area)

| File | Scope |
|------|--------|
| [`.cursor/rules/monstera-core.mdc`](.cursor/rules/monstera-core.mdc) | Always |
| [`.cursor/rules/nuxt-frontend.mdc`](.cursor/rules/nuxt-frontend.mdc) | `app/**` |
| [`.cursor/rules/nitro-server.mdc`](.cursor/rules/nitro-server.mdc) | `server/**` |
| [`.cursor/rules/shared-supabase.mdc`](.cursor/rules/shared-supabase.mdc) | `shared/**`, `supabase/**` |

## Commits and PRs

- Do not commit unless the user explicitly asks.
- CI: lint + typecheck on Node 22 (`.github/workflows/ci.yml`).
