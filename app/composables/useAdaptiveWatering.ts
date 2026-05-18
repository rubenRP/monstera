import { WET_SKIP_LOOKBACK_DAYS } from '#shared/constants/care'
import type { Plant } from '#shared/types/database'
import {
  computeWateringSchedule,
  plantToAdaptiveInput,
  type WateringFactors,
  type WateringScheduleResult
} from '#shared/utils/care/adaptiveWatering'
import {
  alignFertilizeDueAt,
  idealFertilizeDueAt
} from '#shared/utils/care/alignFertilize'

const PLANT_SELECT = '*, site:sites(*)'
const SYNC_STORAGE_PREFIX = 'monstera_watering_sync_'

export function useAdaptiveWatering() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchHomeLat(): Promise<number | null> {
    const uid = user.value?.id
    if (!uid) return null
    const { data } = await supabase
      .from('user_settings')
      .select('home_lat')
      .eq('user_id', uid)
      .maybeSingle()
    const lat = data?.home_lat
    return lat != null ? Number(lat) : null
  }

  async function countRecentWetSkips(plantId: string): Promise<number> {
    const since = new Date()
    since.setDate(since.getDate() - WET_SKIP_LOOKBACK_DAYS)
    const { count, error } = await supabase
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('plant_id', plantId)
      .eq('type', 'water')
      .eq('status', 'skipped')
      .eq('skip_reason', 'soil_wet')
      .gte('completed_at', since.toISOString())
    if (error) throw error
    return count ?? 0
  }

  function computeScheduleForPlant(
    plant: Plant,
    homeLat: number | null,
    options?: {
      recentWetSkipCount?: number
      extraWetDelayDays?: number
      scheduleFromToday?: boolean
      now?: Date
      weatherFactor?: number
    }
  ): WateringScheduleResult {
    return computeWateringSchedule(
      plantToAdaptiveInput(plant, homeLat, options)
    )
  }

  async function recalculatePlantWatering(
    plantId: string,
    options?: {
      extraWetDelayDays?: number
      scheduleFromToday?: boolean
      wetSkipCountOverride?: number
    }
  ): Promise<{ plant: Plant, schedule: WateringScheduleResult, factors: WateringFactors }> {
    const { data: plant, error } = await supabase
      .from('plants')
      .select(PLANT_SELECT)
      .eq('id', plantId)
      .single()
    if (error) throw error

    const homeLat = await fetchHomeLat()
    const wetCount = options?.wetSkipCountOverride
      ?? await countRecentWetSkips(plantId)
    const schedule = computeScheduleForPlant(plant as Plant, homeLat, {
      recentWetSkipCount: wetCount,
      extraWetDelayDays: options?.extraWetDelayDays,
      scheduleFromToday: options?.scheduleFromToday
    })

    const { error: updateError } = await supabase
      .from('plants')
      .update({ watering_interval_days: schedule.effectiveIntervalDays })
      .eq('id', plantId)
    if (updateError) throw updateError

    return {
      plant: { ...(plant as Plant), watering_interval_days: schedule.effectiveIntervalDays },
      schedule,
      factors: schedule.factors
    }
  }

  async function rescheduleWatering(
    plantId: string,
    options?: {
      extraWetDelayDays?: number
      scheduleFromToday?: boolean
      wetSkipCountOverride?: number
    }
  ): Promise<WateringScheduleResult> {
    const uid = user.value?.id
    if (!uid) throw new Error('No autenticado')

    const { schedule } = await recalculatePlantWatering(plantId, options)

    const { error: delError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', plantId)
      .eq('type', 'water')
      .eq('status', 'pending')
    if (delError) throw delError

    const { error: insError } = await supabase.from('care_tasks').insert({
      plant_id: plantId,
      user_id: uid,
      type: 'water',
      due_at: schedule.nextDueAt,
      status: 'pending'
    })
    if (insError) throw insError

    await rescheduleFertilizing(plantId, { nextWaterDueAt: schedule.nextDueAt })

    return schedule
  }

  async function rescheduleFertilizing(
    plantId: string,
    options?: { nextWaterDueAt?: string }
  ): Promise<void> {
    const uid = user.value?.id
    if (!uid) throw new Error('No autenticado')

    const { plant, schedule } = await recalculatePlantWatering(plantId)
    const waterDueAt = options?.nextWaterDueAt ?? schedule.nextDueAt

    const ideal = idealFertilizeDueAt(
      plant.last_fertilized_at ? new Date(plant.last_fertilized_at) : null,
      plant.fertilizing_interval_days
    )
    const aligned = alignFertilizeDueAt(
      ideal,
      new Date(waterDueAt),
      plant.watering_interval_days
    )

    const { error: delError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', plantId)
      .eq('type', 'fertilize')
      .eq('status', 'pending')
    if (delError) throw delError

    const { error: insError } = await supabase.from('care_tasks').insert({
      plant_id: plantId,
      user_id: uid,
      type: 'fertilize',
      due_at: aligned.toISOString(),
      status: 'pending'
    })
    if (insError) throw insError
  }

  async function applySuggestedBaseInterval(plantId: string, baseDays: number): Promise<void> {
    const { error } = await supabase
      .from('plants')
      .update({ watering_base_interval_days: baseDays })
      .eq('id', plantId)
    if (error) throw error
    await rescheduleWatering(plantId)
  }

  async function syncFertilizeAlignmentOnce(): Promise<void> {
    const uid = user.value?.id
    if (!uid || !import.meta.client) return

    const storageKey = 'monstera_fert_water_align_v1'
    if (localStorage.getItem(storageKey)) return

    const { data: plants, error } = await supabase.from('plants').select('id')
    if (error) throw error

    for (const row of plants ?? []) {
      await rescheduleWatering(row.id)
    }

    localStorage.setItem(storageKey, '1')
  }

  async function syncAllIfSeasonChanged(): Promise<void> {
    const uid = user.value?.id
    if (!uid) return

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`
    const storageKey = `${SYNC_STORAGE_PREFIX}${uid}`
    if (import.meta.client && localStorage.getItem(storageKey) === monthKey) {
      return
    }

    const { data: plants, error } = await supabase.from('plants').select('id')
    if (error) throw error

    for (const row of plants ?? []) {
      await rescheduleWatering(row.id)
    }

    if (import.meta.client) {
      localStorage.setItem(storageKey, monthKey)
    }
  }

  return {
    fetchHomeLat,
    countRecentWetSkips,
    computeScheduleForPlant,
    recalculatePlantWatering,
    rescheduleWatering,
    rescheduleFertilizing,
    applySuggestedBaseInterval,
    syncFertilizeAlignmentOnce,
    syncAllIfSeasonChanged
  }
}
