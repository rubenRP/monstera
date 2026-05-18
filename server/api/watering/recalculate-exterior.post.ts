import { WET_SKIP_LOOKBACK_DAYS } from '#shared/constants/care'
import type { Plant } from '#shared/types/database'
import { computeWateringSchedule, plantToAdaptiveInput } from '#shared/utils/care/adaptiveWatering'
import { alignFertilizeDueAt, idealFertilizeDueAt } from '#shared/utils/care/alignFertilize'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

const EXTERIOR_PLACEMENTS = new Set(['outdoor', 'semi_outdoor'])

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const token = authHeader.slice(7)

  const supabase = getServiceSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon')
    .eq('user_id', user.id)
    .maybeSingle()
  if (settingsError) throw settingsError

  if (settings?.home_lat == null || settings?.home_lon == null) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED, {
      messageKey: 'errors.validation.homeLocationRequired'
    })
  }

  const metrics = await fetchWeatherMetrics(Number(settings.home_lat), Number(settings.home_lon))
  if (!metrics) {
    throwApiError(503, API_ERROR_CODES.WEATHER_UNAVAILABLE)
  }

  const outdoorFactor = deriveWeatherFactor(metrics, {
    includeTemperature: true,
    includeHumidity: true,
    includePrecipitation: true
  })
  const semiFactor = deriveWeatherFactor(metrics, {
    includeTemperature: true,
    includeHumidity: true,
    includePrecipitation: false
  })

  const { data: plants, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('user_id', user.id)
  if (plantError) throw plantError

  const exteriorPlants = (plants ?? []).filter((plant) => {
    const placement = plant.site?.placement
    return placement != null && EXTERIOR_PLACEMENTS.has(placement)
  })

  if (!exteriorPlants.length) {
    return { updated: 0, errors: 0, plants: 0 }
  }

  const since = new Date()
  since.setDate(since.getDate() - WET_SKIP_LOOKBACK_DAYS)

  const plantIds = exteriorPlants.map(plant => plant.id)
  const { data: wetSkips } = await supabase
    .from('care_tasks')
    .select('plant_id')
    .eq('user_id', user.id)
    .eq('type', 'water')
    .eq('status', 'skipped')
    .eq('skip_reason', 'soil_wet')
    .gte('completed_at', since.toISOString())
    .in('plant_id', plantIds)

  const wetSkipCounts = new Map<string, number>()
  for (const row of wetSkips ?? []) {
    wetSkipCounts.set(row.plant_id, (wetSkipCounts.get(row.plant_id) ?? 0) + 1)
  }

  let updated = 0
  let errors = 0

  for (const plant of exteriorPlants) {
    const placement = plant.site?.placement
    if (!placement || !EXTERIOR_PLACEMENTS.has(placement)) continue

    const weatherFactor = placement === 'outdoor'
      ? outdoorFactor
      : semiFactor

    try {
      const schedule = computeWateringSchedule(
        plantToAdaptiveInput(plant as Plant, Number(settings.home_lat), {
          recentWetSkipCount: wetSkipCounts.get(plant.id) ?? 0,
          weatherFactor
        })
      )

      const { error: updateError } = await supabase
        .from('plants')
        .update({ watering_interval_days: schedule.effectiveIntervalDays })
        .eq('id', plant.id)
      if (updateError) throw updateError

      const { error: delWaterError } = await supabase
        .from('care_tasks')
        .delete()
        .eq('plant_id', plant.id)
        .eq('type', 'water')
        .eq('status', 'pending')
      if (delWaterError) throw delWaterError

      const { error: insWaterError } = await supabase
        .from('care_tasks')
        .insert({
          plant_id: plant.id,
          user_id: plant.user_id,
          type: 'water',
          due_at: schedule.nextDueAt,
          status: 'pending'
        })
      if (insWaterError) throw insWaterError

      const ideal = idealFertilizeDueAt(
        plant.last_fertilized_at ? new Date(plant.last_fertilized_at) : null,
        plant.fertilizing_interval_days
      )
      const aligned = alignFertilizeDueAt(
        ideal,
        new Date(schedule.nextDueAt),
        schedule.effectiveIntervalDays
      )

      const { error: delFertilizeError } = await supabase
        .from('care_tasks')
        .delete()
        .eq('plant_id', plant.id)
        .eq('type', 'fertilize')
        .eq('status', 'pending')
      if (delFertilizeError) throw delFertilizeError

      const { error: insFertilizeError } = await supabase
        .from('care_tasks')
        .insert({
          plant_id: plant.id,
          user_id: plant.user_id,
          type: 'fertilize',
          due_at: aligned.toISOString(),
          status: 'pending'
        })
      if (insFertilizeError) throw insFertilizeError

      updated++
    } catch (e) {
      errors++
      console.error('Manual recalculation failed:', plant.id, e)
    }
  }

  return { updated, errors, plants: exteriorPlants.length }
})
