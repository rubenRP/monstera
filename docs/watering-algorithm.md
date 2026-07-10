# Watering algorithm

Adaptive watering schedules one pending `water` task per plant. Logic lives in `shared/utils/care/`.

## Flow

1. **Reference interval** — species profile (Perenual), AI fallback, or 7-day default (`resolveWateringReference.ts`).
2. **Environmental interval** — reference × product of factors below (rounded, clamped 1–90 days).
3. **History blend** — with 3+ completed watering intervals, blend up to 60% toward the median real interval (`wateringHistory.ts`).
4. **Next due date** — `last_watered_at + effective interval + wet delay`, or today if overdue (`computeNextWateringDue`).

## Factors

| Factor | Source | Notes |
|--------|--------|-------|
| Season | Calendar month + home latitude | Winter ×1.40, summer ×0.72 |
| Pot size / diameter | `plants.pot_size`, `pot_diameter_cm` | Volume factor |
| Pot material | `plants.pot_material` | Terracotta dries faster (×0.88), plastic slower (×1.12) |
| Substrate | `plants.substrate_type` | e.g. cactus mix ×1.20 |
| Light | `sites.luminosity` | High/direct → shorter interval |
| Humidity | `user_settings.indoor_humidity` | **Indoor only**; outdoor uses weather humidity |
| Weather | Open-Meteo | **Outdoor**: temp + humidity + rain; **Indoor**: softened temperature only |
| Health | `plants.health_status` | Sick/critical → shorter interval |
| Placement | `sites.placement` | Outdoor → shorter interval |
| Window distance | `plants.window_distance_cm` | Indoor/semi-outdoor only |
| Drainage | `plants.has_drainage` | No holes → ×0.90 |
| Wet skips | `care_tasks` skipped `soil_wet` | +1 day each since last watering |

## Indoor vs exterior

- **Indoor**: humidity from Settings (`auto` / `low` / `normal` / `high`). Weather factor uses outdoor temperature only (softened).
- **Semi-outdoor**: full weather except precipitation.
- **Outdoor**: full Open-Meteo weather; ignores manual indoor humidity.

## Recalculation triggers

| Source | When |
|--------|------|
| `task_complete` / `task_skip` | User completes or skips watering |
| `plant_edit` / `plant_move` | Plant or site context changes |
| `home_settings_update` | Location or indoor humidity saved in Settings |
| `season_sync` | Client monthly season check |
| `cron_indoor` / `cron_exterior` | Scheduled batch recalc |

## Key files

- `adaptiveWatering.ts` — factor assembly and due date
- `resolveWateringClimate.ts` — indoor humidity vs outdoor weather
- `resolveIndoorHumidity.ts` — humidity preference → factor
- `runWateringRecalcBatch.ts` — server batch persistence
- `useAdaptiveWatering.ts` — client orchestration
