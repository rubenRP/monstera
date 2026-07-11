import type { SupabaseClient } from '@supabase/supabase-js'
import { wetSkipCountSince } from '#shared/utils/care/wetSkips'
import type { IndoorHumidityLevel, Placement, Plant } from '#shared/types/database'
import { resolveWateringClimateFactors } from '#shared/utils/care/resolveWateringClimate'
import type { WeatherMetrics } from '#shared/utils/weather/deriveWeatherFactor'
import {
  computeOptimalWateringSchedule,
  plantToAdaptiveInput
} from '#shared/utils/care/adaptiveWatering'
import { alignFertilizeDueAt, idealFertilizeDueAt } from '#shared/utils/care/alignFertilize'
import { hasOverduePendingWaterTask } from '#shared/utils/care/overdueWaterTask'
import { loadWaterResolvedTodayPlantIds } from '#shared/utils/care/resolvedToday'
import { inferPreviousWaterDueAt, type WateringRecalcSource } from '#shared/utils/care/wateringRecalcEvent'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { upsertPendingCheckInTask } from './checkInTask'
import { fetchWateringHistoryIntervals } from './wateringHistory'
import {
  fetchPendingWaterDueAt,
  logWateringRecalcEvent
} from './wateringRecalcEvent'
import { resolveWateringReferenceForPlant } from './wateringContext'
import { fetchWeatherMetrics } from '../weather'

export interface WateringRecalcUserSettings {
  homeLat: number | null
  homeLon: number | null
  indoorHumidity: IndoorHumidityLevel
}

export interface WateringRecalcBatchPlantContext {
  homeLat: number | null
  humidityFactor: number
  weatherFactor: number
}

export interface RunWateringRecalcBatchOptions {
  plants: (Plant & { site?: { placement?: string | null } | null })[]
  plantContextById: Map<string, WateringRecalcBatchPlantContext>
  wetSkipCounts: Map<string, number>
  source: WateringRecalcSource
  supabase: SupabaseClient
  locale?: AppLocale
  perenualApiKey?: string
  cursorApiKey?: string
  allowCursor?: boolean
}

export interface WateringRecalcBatchResult {
  updated: number
  skipped: number
  errors: number
}

export async function runWateringRecalcBatch(
  options: RunWateringRecalcBatchOptions
): Promise<WateringRecalcBatchResult> {
  let updated = 0
  let skipped = 0
  let errors = 0

  const waterResolvedTodayPlantIds = await loadWaterResolvedTodayPlantIds(
    options.supabase,
    options.plants.map(plant => plant.id)
  )

  for (const plant of options.plants) {
    const ctx = options.plantContextById.get(plant.id)
    if (!ctx) {
      skipped++
      continue
    }

    try {
      if (await hasOverduePendingWaterTask(options.supabase, plant.id)) {
        skipped++
        continue
      }

      const previousDueAt = inferPreviousWaterDueAt({
        pendingDueAt: await fetchPendingWaterDueAt(options.supabase, plant.id),
        lastWateredAt: plant.last_watered_at,
        intervalDays: plant.watering_interval_days
      })
      const previousIntervalDays = plant.watering_interval_days

      const reference = await resolveWateringReferenceForPlant(
        options.supabase,
        plant as Plant,
        {
          locale: options.locale,
          perenualApiKey: options.perenualApiKey,
          cursorApiKey: options.cursorApiKey,
          allowCursor: options.allowCursor ?? false
        }
      )

      const historyIntervals = await fetchWateringHistoryIntervals(
        options.supabase,
        plant.id
      )

      const schedule = computeOptimalWateringSchedule(
        plantToAdaptiveInput(plant as Plant, ctx.homeLat, {
          speciesReferenceDays: reference.referenceDays,
          referenceSource: reference.source,
          recentWetSkipCount: options.wetSkipCounts.get(plant.id) ?? 0,
          humidityFactor: ctx.humidityFactor,
          weatherFactor: ctx.weatherFactor,
          completedWaterIntervals: historyIntervals,
          scheduleFromToday: waterResolvedTodayPlantIds.has(plant.id)
        })
      )

      const { error: updateError } = await options.supabase
        .from('plants')
        .update({
          watering_interval_days: schedule.effectiveIntervalDays,
          watering_base_interval_days: reference.referenceDays
        })
        .eq('id', plant.id)
      if (updateError) throw updateError

      const { error: delWaterError } = await options.supabase
        .from('care_tasks')
        .delete()
        .eq('plant_id', plant.id)
        .eq('type', 'water')
        .eq('status', 'pending')
      if (delWaterError) throw delWaterError

      const { error: insWaterError } = await options.supabase
        .from('care_tasks')
        .insert({
          plant_id: plant.id,
          user_id: plant.user_id,
          type: 'water',
          due_at: schedule.nextDueAt,
          status: 'pending'
        })
      if (insWaterError) throw insWaterError

      await logWateringRecalcEvent(options.supabase, {
        userId: plant.user_id,
        plantId: plant.id,
        plantName: plant.name,
        source: options.source,
        previousDueAt,
        newDueAt: schedule.nextDueAt,
        previousIntervalDays,
        newIntervalDays: schedule.effectiveIntervalDays
      })

      const ideal = idealFertilizeDueAt(
        plant.last_fertilized_at ? new Date(plant.last_fertilized_at) : null,
        plant.fertilizing_interval_days
      )
      const aligned = alignFertilizeDueAt(
        ideal,
        new Date(schedule.nextDueAt),
        schedule.effectiveIntervalDays
      )

      const { error: delFertilizeError } = await options.supabase
        .from('care_tasks')
        .delete()
        .eq('plant_id', plant.id)
        .eq('type', 'fertilize')
        .eq('status', 'pending')
      if (delFertilizeError) throw delFertilizeError

      const { error: insFertilizeError } = await options.supabase
        .from('care_tasks')
        .insert({
          plant_id: plant.id,
          user_id: plant.user_id,
          type: 'fertilize',
          due_at: aligned.toISOString(),
          status: 'pending'
        })
      if (insFertilizeError) throw insFertilizeError

      await upsertPendingCheckInTask(options.supabase, {
        id: plant.id,
        user_id: plant.user_id,
        last_check_in_at: plant.last_check_in_at,
        check_in_interval_days: plant.check_in_interval_days ?? 30,
        created_at: plant.created_at
      })

      updated++
    } catch (e) {
      errors++
      console.error('[watering-recalc-batch]', plant.id, e)
    }
  }

  return { updated, skipped, errors }
}

export async function loadWetSkipCounts(
  supabase: SupabaseClient,
  plants: Pick<Plant, 'id' | 'last_watered_at'>[]
): Promise<Map<string, number>> {
  if (!plants.length) return new Map()

  const now = new Date()
  const sinceByPlant = new Map(
    plants.map(plant => [
      plant.id,
      wetSkipCountSince(plant.last_watered_at, now)
    ])
  )
  const earliestSince = [...sinceByPlant.values()].reduce((min, date) =>
    date < min ? date : min
  )

  const { data: wetSkips, error } = await supabase
    .from('care_tasks')
    .select('plant_id, completed_at')
    .eq('type', 'water')
    .eq('status', 'skipped')
    .eq('skip_reason', 'soil_wet')
    .gte('completed_at', earliestSince.toISOString())
    .in('plant_id', plants.map(plant => plant.id))
  if (error) throw error

  const wetSkipCounts = new Map<string, number>()
  for (const row of wetSkips ?? []) {
    if (!row.completed_at) continue
    const since = sinceByPlant.get(row.plant_id)
    if (!since || new Date(row.completed_at) < since) continue
    wetSkipCounts.set(row.plant_id, (wetSkipCounts.get(row.plant_id) ?? 0) + 1)
  }
  return wetSkipCounts
}

const EXTERIOR_PLACEMENTS = new Set(['outdoor', 'semi_outdoor'])

export async function buildWateringRecalcContexts(
  plants: (Plant & { site?: { placement?: string | null } | null })[],
  settingsByUserId: Map<string, WateringRecalcUserSettings>
): Promise<Map<string, WateringRecalcBatchPlantContext>> {
  const metricsByUserId = new Map<string, WeatherMetrics | null>()

  for (const [userId, settings] of settingsByUserId) {
    if (settings.homeLat == null || settings.homeLon == null) {
      metricsByUserId.set(userId, null)
      continue
    }
    if (metricsByUserId.has(userId)) continue
    const metrics = await fetchWeatherMetrics(settings.homeLat, settings.homeLon)
    metricsByUserId.set(userId, metrics)
  }

  const plantContextById = new Map<string, WateringRecalcBatchPlantContext>()
  for (const plant of plants) {
    const settings = settingsByUserId.get(plant.user_id) ?? {
      homeLat: null,
      homeLon: null,
      indoorHumidity: 'auto' as IndoorHumidityLevel
    }
    const metrics = metricsByUserId.get(plant.user_id) ?? null
    const outdoorHumidity = metrics?.avgHumidity ?? null
    const climate = resolveWateringClimateFactors({
      placement: (plant.site?.placement ?? null) as Placement | null,
      indoorHumidity: settings.indoorHumidity,
      outdoorHumidityPercent: outdoorHumidity,
      weatherMetrics: metrics
    })
    plantContextById.set(plant.id, {
      homeLat: settings.homeLat,
      humidityFactor: climate.humidityFactor,
      weatherFactor: climate.weatherFactor
    })
  }
  return plantContextById
}

export function filterExteriorPlants(
  plants: (Plant & { site?: { placement?: string | null } | null })[]
): Plant[] {
  return plants.filter((plant) => {
    const placement = plant.site?.placement
    return placement != null && EXTERIOR_PLACEMENTS.has(placement)
  }) as Plant[]
}
