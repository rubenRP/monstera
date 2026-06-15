# Architecture

High-level overview for operators and contributors. For implementation patterns, see [AGENTS.md](../AGENTS.md).

## Components

| Layer | Technology | Role |
|-------|------------|------|
| Frontend | Nuxt 4, Vue 3, Nuxt UI | PWA UI, i18n (es/en) |
| API | Nitro (`server/api`) | AI routes, species, push, cron |
| Database | Supabase Postgres | Plants, sites, care tasks, diagnoses |
| Auth | Supabase magic link | Per-user sessions |
| Storage | Supabase `plant-photos` bucket | Private plant photos (RLS by user folder) |
| Weather | Open-Meteo | Recommendations and exterior watering cron |
| AI | Cursor API (`@cursor/sdk`) | Diagnosis and recommendations (optional) |
| Species | Perenual API + `species_profiles` cache | Species tab (optional) |

## Data flow

```mermaid
flowchart TB
  subgraph client [Browser PWA]
    Pages[Pages and components]
    Composables[Composables]
    Pages --> Composables
  end

  subgraph supabase [Supabase]
    DB[(Postgres + RLS)]
    Storage[(plant-photos)]
    Auth[Magic link auth]
  end

  subgraph nitro [Nitro server]
    Diagnose[/api/diagnose]
    Recommend[/api/recommend]
    Species[/api/plants/id/species-profile]
    CronSend[/api/cron/send-daily]
    CronWater[/api/cron/recalculate-watering]
  end

  subgraph external [External APIs]
    Cursor[Cursor]
    Perenual[Perenual]
    OpenMeteo[Open-Meteo]
  end

  Composables -->|anon key| DB
  Composables --> Storage
  Composables --> Auth
  Composables -->|JWT Bearer| nitro
  Diagnose --> Cursor
  Recommend --> Cursor
  Recommend --> OpenMeteo
  Species --> Perenual
  CronWater --> OpenMeteo
  nitro -->|service key| DB
```

## Security model

- **Client**: Supabase publishable key only; all user tables protected by RLS (`auth.uid() = user_id`).
- **Server**: Secret key for routes that need elevated access; every user-scoped handler validates `Authorization: Bearer <access_token>`.
- **Storage**: Objects stored under `{userId}/...`; policies restrict read/write to the owner.
- **Species cache**: `species_profiles` is read-only for authenticated users; writes use the service role on the server.
- **Cron**: `CRON_SECRET` required on self-host; Vercel sends `x-vercel-cron` or Bearer token.

## Domain entities

| Entity | Table | Notes |
|--------|-------|--------|
| Plant | `plants` | Intervals, health, optional site |
| Site | `sites` | Placement, orientation, luminosity |
| CareTask | `care_tasks` | `water` / `fertilize`; pending / done / skipped |
| Diagnosis | `diagnoses` | AI history |
| SpeciesProfile | `species_profiles` | Global cache by species query |
| UserSettings | `user_settings` | Home coordinates for weather |

Types: [`shared/types/database.ts`](../shared/types/database.ts).

## Background jobs

| Job | Trigger | Function |
|-----|---------|----------|
| `send-daily` | Daily 09:00 UTC | Web Push for users with pending tasks |
| `recalculate-watering` | Every 2 days | Weather-based intervals for outdoor/semi-outdoor plants |

Configured in [`vercel.json`](../vercel.json); self-hosters use system cron — see [self-hosting.md](./self-hosting.md).
