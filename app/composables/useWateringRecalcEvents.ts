import type { WateringRecalcEvent, WateringRecalcSnapshot, WateringRecalcSource } from '#shared/utils/care/wateringRecalcEvent'
import {
  wateringRecalcEventHasChange,
  wateringRecalcHasChange
} from '#shared/utils/care/wateringRecalcEvent'

const RECENT_DAYS = 7

export function useWateringRecalcEvents() {
  const supabase = useSupabaseClient()
  const { requireUserId } = useRequireUserId()
  const events = useState<WateringRecalcEvent[]>('wateringRecalcEvents', () => [])
  const loading = useState('wateringRecalcEventsLoading', () => false)

  async function fetchWateringSnapshot(plantId: string): Promise<WateringRecalcSnapshot> {
    const [{ data: plant, error: plantError }, { data: task, error: taskError }] = await Promise.all([
      supabase
        .from('plants')
        .select('name, watering_interval_days')
        .eq('id', plantId)
        .single(),
      supabase
        .from('care_tasks')
        .select('due_at')
        .eq('plant_id', plantId)
        .eq('type', 'water')
        .eq('status', 'pending')
        .maybeSingle()
    ])
    if (plantError) throw plantError
    if (taskError) throw taskError
    return {
      plantName: plant.name,
      intervalDays: plant.watering_interval_days,
      dueAt: task?.due_at ?? null
    }
  }

  async function logWateringRecalcEvent(input: {
    plantId: string
    plantName: string
    source: WateringRecalcSource
    previousDueAt: string | null
    newDueAt: string
    previousIntervalDays: number | null
    newIntervalDays: number
  }): Promise<void> {
    if (!wateringRecalcHasChange(
      input.previousDueAt,
      input.newDueAt,
      input.previousIntervalDays,
      input.newIntervalDays
    )) {
      return
    }

    const uid = await requireUserId()
    const { data, error } = await supabase
      .from('watering_recalc_events')
      .insert({
        user_id: uid,
        plant_id: input.plantId,
        plant_name: input.plantName,
        source: input.source,
        previous_due_at: input.previousDueAt,
        new_due_at: input.newDueAt,
        previous_interval_days: input.previousIntervalDays,
        new_interval_days: input.newIntervalDays
      })
      .select('*')
      .single()
    if (error) throw error
    const event = data as WateringRecalcEvent
    if (!wateringRecalcEventHasChange(event)) return
    events.value = [event, ...events.value.filter(e => e.id !== event.id)]
  }

  async function fetchRecentEvents() {
    loading.value = true
    try {
      const since = new Date()
      since.setDate(since.getDate() - RECENT_DAYS)
      const { data, error } = await supabase
        .from('watering_recalc_events')
        .select('*')
        .is('dismissed_at', null)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      events.value = ((data ?? []) as WateringRecalcEvent[])
        .filter(wateringRecalcEventHasChange)
    } finally {
      loading.value = false
    }
  }

  async function dismissEvent(id: string) {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('watering_recalc_events')
      .update({ dismissed_at: now })
      .eq('id', id)
    if (error) throw error
    events.value = events.value.filter(event => event.id !== id)
  }

  async function dismissAll() {
    const ids = events.value.map(event => event.id)
    if (!ids.length) return
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('watering_recalc_events')
      .update({ dismissed_at: now })
      .in('id', ids)
    if (error) throw error
    events.value = []
  }

  return {
    events,
    loading,
    fetchWateringSnapshot,
    logWateringRecalcEvent,
    fetchRecentEvents,
    dismissEvent,
    dismissAll
  }
}
