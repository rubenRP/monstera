import { WET_SKIP_LOOKBACK_DAYS } from '#shared/constants/care'
import type { Plant } from '#shared/types/database'
import {
  computeOptimalWateringSchedule,
  plantToAdaptiveInput,
  type WateringFactors,
  type WateringScheduleResult
} from '#shared/utils/care/adaptiveWatering'
import type { WateringReferenceResult } from '#shared/utils/care/resolveWateringReference'
import {
  alignFertilizeDueAt,
  idealFertilizeDueAt
} from '#shared/utils/care/alignFertilize'
import { idealCheckInDueAt } from '#shared/utils/care/checkInSchedule'
import { WATERING_HISTORY_LOOKBACK_DAYS, daysBetweenWateringCompletions } from '#shared/utils/care/wateringHistory'
import { hasOverduePendingWaterTask as queryOverduePendingWaterTask } from '#shared/utils/care/overdueWaterTask'
import type { WateringRecalcSource } from '#shared/utils/care/wateringRecalcEvent'

const PLANT_SELECT = '*, site:sites(*)'
const SYNC_STORAGE_PREFIX = 'monstera_watering_sync_'

export function useAdaptiveWatering() {
  const supabase = useSupabaseClient()
  const { requireUserId } = useRequireUserId()
  const { fetchWateringSnapshot, logWateringRecalcEvent } = useWateringRecalcEvents()
  const { localeHeaders } = useI18nHeaders()

  async function hasOverduePendingWaterTask(plantId: string): Promise<boolean> {
    return queryOverduePendingWaterTask(supabase, plantId)
  }

  async function fetchHomeLat(): Promise<number | null> {
    let uid: string
    try {
      uid = await requireUserId()
    } catch {
      return null
    }
    const { data } = await supabase
      .from('user_settings')
      .select('home_lat')
      .eq('user_id', uid)
      .maybeSingle()
    const lat = data?.home_lat
    return lat != null ? Number(lat) : null
  }

  const { weatherFactorForPlant } = usePlantWeatherFactor()

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

  async function fetchWateringHistoryIntervals(plantId: string): Promise<number[]> {
    const since = new Date()
    since.setDate(since.getDate() - WATERING_HISTORY_LOOKBACK_DAYS)

    const { data, error } = await supabase
      .from('care_tasks')
      .select('completed_at')
      .eq('plant_id', plantId)
      .eq('type', 'water')
      .eq('status', 'done')
      .gte('completed_at', since.toISOString())
      .order('completed_at', { ascending: true })

    if (error) throw error

    const timestamps = (data ?? [])
      .map(row => row.completed_at)
      .filter((at): at is string => at != null)

    return daysBetweenWateringCompletions(timestamps)
  }

  async function resolveWateringReference(
    plantId: string,
    allowCursor = true
  ): Promise<WateringReferenceResult> {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) throw new Error('Not authenticated')

    return $fetch<WateringReferenceResult>('/api/watering/resolve-reference', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...localeHeaders()
      },
      body: { plantId, allowCursor }
    })
  }

  async function computeScheduleForPlant(
    plant: Plant,
    homeLat: number | null,
    options?: {
      recentWetSkipCount?: number
      extraWetDelayDays?: number
      scheduleFromToday?: boolean
      now?: Date
      weatherFactor?: number
      speciesReferenceDays?: number
      referenceSource?: WateringReferenceResult['source']
      completedWaterIntervals?: number[]
    }
  ): Promise<WateringScheduleResult> {
    let weatherFactor = options?.weatherFactor
    if (weatherFactor == null) {
      weatherFactor = await weatherFactorForPlant(plant.site?.placement)
    }
    return computeOptimalWateringSchedule(
      plantToAdaptiveInput(plant, homeLat, { ...options, weatherFactor })
    )
  }

  async function recalculatePlantWatering(
    plantId: string,
    options?: {
      extraWetDelayDays?: number
      scheduleFromToday?: boolean
      wetSkipCountOverride?: number
      allowCursor?: boolean
      referenceOverride?: WateringReferenceResult
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
    const historyIntervals = await fetchWateringHistoryIntervals(plantId)

    const reference = options?.referenceOverride
      ?? await resolveWateringReference(plantId, options?.allowCursor ?? true)

    const schedule = await computeScheduleForPlant(plant as Plant, homeLat, {
      recentWetSkipCount: wetCount,
      extraWetDelayDays: options?.extraWetDelayDays,
      scheduleFromToday: options?.scheduleFromToday,
      speciesReferenceDays: reference.referenceDays,
      referenceSource: reference.source,
      completedWaterIntervals: historyIntervals
    })

    const { error: updateError } = await supabase
      .from('plants')
      .update({
        watering_interval_days: schedule.effectiveIntervalDays,
        watering_base_interval_days: reference.referenceDays
      })
      .eq('id', plantId)
    if (updateError) throw updateError

    return {
      plant: {
        ...(plant as Plant),
        watering_interval_days: schedule.effectiveIntervalDays,
        watering_base_interval_days: reference.referenceDays
      },
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
      source?: WateringRecalcSource
      allowCursor?: boolean
      referenceOverride?: WateringReferenceResult
      previousDueAtOverride?: string | null
    }
  ): Promise<WateringScheduleResult | null> {
    const { data: row } = await supabase
      .from('plants')
      .select('archived_at')
      .eq('id', plantId)
      .maybeSingle()
    if (row?.archived_at) return null

    const uid = await requireUserId()
    const before = await fetchWateringSnapshot(plantId)

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

    if (options?.source) {
      await logWateringRecalcEvent({
        plantId,
        plantName: before.plantName,
        source: options.source,
        previousDueAt: options?.previousDueAtOverride ?? before.dueAt,
        newDueAt: schedule.nextDueAt,
        previousIntervalDays: before.intervalDays,
        newIntervalDays: schedule.effectiveIntervalDays
      })
    }

    await rescheduleFertilizing(plantId, { nextWaterDueAt: schedule.nextDueAt })

    return schedule
  }

  async function rescheduleFertilizing(
    plantId: string,
    options?: { nextWaterDueAt?: string }
  ): Promise<void> {
    const { data: row } = await supabase
      .from('plants')
      .select('archived_at')
      .eq('id', plantId)
      .maybeSingle()
    if (row?.archived_at) return

    const uid = await requireUserId()

    const { plant, schedule } = await recalculatePlantWatering(plantId, { allowCursor: false })
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

  async function rescheduleCheckIn(
    plantId: string,
    options?: { scheduleFromToday?: boolean }
  ): Promise<void> {
    const { data: row } = await supabase
      .from('plants')
      .select('archived_at, last_check_in_at, check_in_interval_days, created_at')
      .eq('id', plantId)
      .maybeSingle()
    if (row?.archived_at) return

    const uid = await requireUserId()

    const interval = row?.check_in_interval_days ?? 30
    let due: Date
    if (options?.scheduleFromToday) {
      due = new Date()
      due.setDate(due.getDate() + interval)
    } else {
      const anchor = row?.last_check_in_at
        ? new Date(row.last_check_in_at)
        : (row?.created_at ? new Date(row.created_at) : new Date())
      due = idealCheckInDueAt(
        row?.last_check_in_at ? anchor : null,
        interval,
        anchor
      )
      if (due.getTime() < Date.now()) {
        due = new Date()
      }
    }

    const { error: delError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', plantId)
      .eq('type', 'check_in')
      .eq('status', 'pending')
    if (delError) throw delError

    const { error: insError } = await supabase.from('care_tasks').insert({
      plant_id: plantId,
      user_id: uid,
      type: 'check_in',
      due_at: due.toISOString(),
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
    await rescheduleWatering(plantId, {
      source: 'base_interval_update',
      allowCursor: false,
      referenceOverride: { referenceDays: baseDays, source: 'override' }
    })
  }

  async function syncFertilizeAlignmentOnce(): Promise<void> {
    if (!import.meta.client) return
    try {
      await requireUserId()
    } catch {
      return
    }

    const storageKey = 'monstera_fert_water_align_v1'
    if (localStorage.getItem(storageKey)) return

    const { data: plants, error } = await supabase
      .from('plants')
      .select('id')
      .is('archived_at', null)
    if (error) throw error

    for (const row of plants ?? []) {
      if (await hasOverduePendingWaterTask(row.id)) {
        continue
      }
      await rescheduleWatering(row.id, { source: 'fertilize_align_sync', allowCursor: false })
      await rescheduleCheckIn(row.id)
    }

    localStorage.setItem(storageKey, '1')
  }

  async function syncAllIfSeasonChanged(): Promise<void> {
    let uid: string
    try {
      uid = await requireUserId()
    } catch {
      return
    }

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`
    const storageKey = `${SYNC_STORAGE_PREFIX}${uid}`
    if (import.meta.client && localStorage.getItem(storageKey) === monthKey) {
      return
    }

    const { data: plants, error } = await supabase
      .from('plants')
      .select('id')
      .is('archived_at', null)
    if (error) throw error

    for (const row of plants ?? []) {
      if (await hasOverduePendingWaterTask(row.id)) {
        continue
      }
      await rescheduleWatering(row.id, { source: 'season_sync', allowCursor: false })
      await rescheduleCheckIn(row.id)
    }

    if (import.meta.client) {
      localStorage.setItem(storageKey, monthKey)
    }
  }

  return {
    fetchHomeLat,
    countRecentWetSkips,
    fetchWateringHistoryIntervals,
    resolveWateringReference,
    computeScheduleForPlant,
    recalculatePlantWatering,
    hasOverduePendingWaterTask,
    rescheduleWatering,
    rescheduleFertilizing,
    rescheduleCheckIn,
    applySuggestedBaseInterval,
    syncFertilizeAlignmentOnce,
    syncAllIfSeasonChanged
  }
}
