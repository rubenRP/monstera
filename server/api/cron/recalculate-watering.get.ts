import { WET_SKIP_LOOKBACK_DAYS } from '#shared/constants/care'
import type { Plant } from '#shared/types/database'
import { computeWateringSchedule, plantToAdaptiveInput } from '#shared/utils/care/adaptiveWatering'
import { alignFertilizeDueAt, idealFertilizeDueAt } from '#shared/utils/care/alignFertilize'
import { upsertPendingCheckInTask } from '../../utils/care/checkInTask'

const EXTERIOR_PLACEMENTS = new Set(['outdoor', 'semi_outdoor'])

export default defineEventHandler(async (event) => {
  assertCronAuthorized(event)

  const supabase = getServiceSupabase()

  const { data: plants, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .is('archived_at', null)
  if (plantError) throw plantError

  const exteriorPlants = (plants ?? []).filter((plant) => {
    const placement = plant.site?.placement
    return placement != null && EXTERIOR_PLACEMENTS.has(placement)
  })

  if (!exteriorPlants.length) {
    return { updated: 0, skipped: 0, errors: 0, users: 0, plants: 0 }
  }

  const plantsByUser = new Map<string, typeof exteriorPlants>()
  for (const plant of exteriorPlants) {
    const list = plantsByUser.get(plant.user_id) ?? []
    list.push(plant)
    plantsByUser.set(plant.user_id, list)
  }

  const userIds = [...plantsByUser.keys()]
  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, home_lat, home_lon')
    .in('user_id', userIds)
  if (settingsError) throw settingsError

  const settingsByUser = new Map(
    (settingsRows ?? []).map(row => [row.user_id, row])
  )

  const since = new Date()
  since.setDate(since.getDate() - WET_SKIP_LOOKBACK_DAYS)

  const plantIds = exteriorPlants.map(plant => plant.id)
  const { data: wetSkips } = await supabase
    .from('care_tasks')
    .select('plant_id')
    .eq('type', 'water')
    .eq('status', 'skipped')
    .eq('skip_reason', 'soil_wet')
    .gte('completed_at', since.toISOString())
    .in('plant_id', plantIds)

  const wetSkipCounts = new Map<string, number>()
  for (const row of wetSkips ?? []) {
    wetSkipCounts.set(row.plant_id, (wetSkipCounts.get(row.plant_id) ?? 0) + 1)
  }

  const userFactors = new Map<string, {
    homeLat: number
    outdoorFactor: number
    semiFactor: number
  }>()

  let skipped = 0
  let errors = 0

  for (const userId of userIds) {
    const userPlants = plantsByUser.get(userId) ?? []
    const settings = settingsByUser.get(userId)
    const homeLat = settings?.home_lat
    const homeLon = settings?.home_lon
    if (homeLat == null || homeLon == null) {
      skipped += userPlants.length
      continue
    }

    const metrics = await fetchWeatherMetrics(Number(homeLat), Number(homeLon))
    if (!metrics) {
      skipped += userPlants.length
      continue
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

    userFactors.set(userId, {
      homeLat: Number(homeLat),
      outdoorFactor,
      semiFactor
    })
  }

  let updated = 0

  for (const plant of exteriorPlants) {
    const userFactor = userFactors.get(plant.user_id)
    if (!userFactor) continue

    const placement = plant.site?.placement
    if (!placement || !EXTERIOR_PLACEMENTS.has(placement)) continue

    const weatherFactor = placement === 'outdoor'
      ? userFactor.outdoorFactor
      : userFactor.semiFactor

    try {
      const schedule = computeWateringSchedule(
        plantToAdaptiveInput(plant as Plant, userFactor.homeLat, {
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

      await upsertPendingCheckInTask(supabase, {
        id: plant.id,
        user_id: plant.user_id,
        last_check_in_at: plant.last_check_in_at,
        check_in_interval_days: plant.check_in_interval_days ?? 30,
        created_at: plant.created_at
      })

      updated++
    } catch (e) {
      errors++
      console.error('Cron recalculation failed:', plant.id, e)
    }
  }

  return {
    updated,
    skipped,
    errors,
    users: userFactors.size,
    plants: exteriorPlants.length
  }
})
