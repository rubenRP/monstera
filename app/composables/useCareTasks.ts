import type { CareTask, CareTaskType } from '#shared/types/database'
import {
  deduplicateOverlappingTasks,
  deduplicateResolvedTasks
} from '#shared/utils/care/deduplicateTasks'
import { isSameCalendarDay } from '#shared/utils/care/alignFertilize'
import { taskOverdueDays } from '#shared/utils/care/taskDue'
import { replacePendingCareTask } from '#shared/utils/care/pendingTask'
import { postponedDueAt } from '#shared/utils/care/postpone'
import { assertOnline } from '~/utils/offline'

export function useCareTasks() {
  const supabase = useSupabaseClient()
  const {
    rescheduleWatering,
    rescheduleFertilizing,
    rescheduleCheckIn,
    countRecentWetSkips
  } = useAdaptiveWatering()

  async function deleteOverlappingPendingTasks(task: CareTask, exceptId: string) {
    const { error } = await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', task.plant_id)
      .eq('type', task.type)
      .eq('status', 'pending')
      .neq('id', exceptId)
    if (error) throw error
  }

  const taskSelect = '*, plant:plants(id, name, photo_path, health_status, archived_at, last_watered_at, site:sites(id, name))'

  function filterActivePlantTasks(tasks: CareTask[]): CareTask[] {
    return tasks.filter(t => !t.plant?.archived_at)
  }

  async function fetchPendingTasks(options?: { plantId?: string, dueBefore?: Date }) {
    let query = supabase
      .from('care_tasks')
      .select(taskSelect)
      .eq('status', 'pending')
      .order('due_at')

    if (options?.plantId) {
      query = query.eq('plant_id', options.plantId)
    }
    if (options?.dueBefore) {
      query = query.lte('due_at', options.dueBefore.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return deduplicateOverlappingTasks(filterActivePlantTasks((data ?? []) as CareTask[]))
  }

  function todayBounds() {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  async function fetchTodayTasks() {
    const { end } = todayBounds()
    return fetchPendingTasks({ dueBefore: end })
  }

  async function fetchTodayCompletedTasks() {
    const { start, end } = todayBounds()
    const { data, error } = await supabase
      .from('care_tasks')
      .select(taskSelect)
      .in('status', ['done', 'skipped'])
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString())
      .order('completed_at', { ascending: false })
    if (error) throw error
    return deduplicateResolvedTasks(
      filterActivePlantTasks((data ?? []) as CareTask[])
    )
  }

  async function fetchUpcomingTasks(days = 7) {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() + days)
    return fetchPendingTasks({ dueBefore: end })
  }

  async function fetchPlantPendingTasks(plantId: string) {
    return fetchPendingTasks({ plantId })
  }

  async function fetchCareHistory(plantId: string, limit = 50) {
    const { data, error } = await supabase
      .from('care_tasks')
      .select('*')
      .eq('plant_id', plantId)
      .in('status', ['done', 'skipped'])
      .order('completed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as CareTask[]
  }

  async function fetchTasksInRange(start: Date, end: Date) {
    const [inRange, overdue] = await Promise.all([
      supabase
        .from('care_tasks')
        .select(taskSelect)
        .eq('status', 'pending')
        .gte('due_at', start.toISOString())
        .lte('due_at', end.toISOString())
        .order('due_at'),
      supabase
        .from('care_tasks')
        .select(taskSelect)
        .eq('status', 'pending')
        .lt('due_at', start.toISOString())
        .order('due_at')
    ])
    if (inRange.error) throw inRange.error
    if (overdue.error) throw overdue.error
    const merged = [
      ...(overdue.data ?? []),
      ...(inRange.data ?? [])
    ] as CareTask[]
    return deduplicateOverlappingTasks(filterActivePlantTasks(merged))
  }

  async function fetchResolvedTasksInRange(start: Date, end: Date) {
    const { data, error } = await supabase
      .from('care_tasks')
      .select(taskSelect)
      .in('status', ['done', 'skipped'])
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString())
      .order('completed_at')
    if (error) throw error
    return filterActivePlantTasks((data ?? []) as CareTask[])
  }

  async function completeTask(task: CareTask) {
    assertOnline()

    const now = new Date().toISOString()
    const { error: taskError } = await supabase
      .from('care_tasks')
      .update({ status: 'done', completed_at: now })
      .eq('id', task.id)
    if (taskError) throw taskError
    await deleteOverlappingPendingTasks(task, task.id)

    if (task.type === 'water') {
      const { error: plantError } = await supabase
        .from('plants')
        .update({ last_watered_at: now })
        .eq('id', task.plant_id)
      if (plantError) throw plantError

      await rescheduleWatering(task.plant_id, {
        wetSkipCountOverride: 0,
        source: 'task_complete',
        previousDueAtOverride: task.due_at
      })
      return
    }

    if (task.type === 'fertilize') {
      const { error: plantError } = await supabase
        .from('plants')
        .update({ last_fertilized_at: now })
        .eq('id', task.plant_id)
      if (plantError) throw plantError

      await rescheduleFertilizing(task.plant_id)
      return
    }

    throw new Error('CHECK_IN_REQUIRES_MODAL')
  }

  async function hasPendingTaskDueToday(plantId: string, type: CareTaskType) {
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { count, error } = await supabase
      .from('care_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('plant_id', plantId)
      .eq('type', type)
      .eq('status', 'pending')
      .lte('due_at', end.toISOString())
    if (error) throw error
    return (count ?? 0) > 0
  }

  /** Moves the plant's pending task of `type` to today (or creates it). */
  async function createAdvanceTask(plantId: string, type: CareTaskType = 'water') {
    assertOnline()

    if (await hasPendingTaskDueToday(plantId, type)) {
      return null
    }

    const moved = await replacePendingCareTask(supabase, plantId, type, new Date().toISOString())
    const { data, error } = await supabase
      .from('care_tasks')
      .select(taskSelect)
      .eq('id', moved.id)
      .single()
    if (error) throw error
    return data as CareTask
  }

  async function skipTask(task: CareTask, options?: { soilStillWet?: boolean }) {
    assertOnline()

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('care_tasks')
      .update({
        status: 'skipped',
        completed_at: now,
        skip_reason: options?.soilStillWet ? 'soil_wet' : null
      })
      .eq('id', task.id)
    if (error) throw error
    await deleteOverlappingPendingTasks(task, task.id)

    if (task.type === 'water') {
      const wetCount = await countRecentWetSkips(task.plant_id)
      const schedule = await rescheduleWatering(task.plant_id, {
        scheduleFromToday: true,
        wetSkipCountOverride: wetCount,
        source: 'task_skip',
        previousDueAtOverride: task.due_at
      })
      return schedule?.effectiveIntervalDays
    }

    if (task.type === 'fertilize') {
      await rescheduleFertilizing(task.plant_id)
      return
    }

    await rescheduleCheckIn(task.plant_id, { scheduleFromToday: true })
  }

  /** Moves the task `days` later without touching the watering interval or history. */
  async function postponeTask(task: CareTask, days: number) {
    assertOnline()
    const dueAt = postponedDueAt(task.due_at, days)
    await replacePendingCareTask(supabase, task.plant_id, task.type, dueAt)
    if (task.type === 'water') {
      // Keep "fertilize with water" aligned to the new watering date
      await rescheduleFertilizing(task.plant_id)
    }
    return dueAt
  }

  const { t } = useI18n()

  function taskLabel(type: CareTaskType) {
    if (type === 'water') return t('care.taskWater')
    if (type === 'fertilize') return t('care.taskFertilize')
    return t('care.taskCheckIn')
  }

  function taskIcon(type: CareTaskType) {
    if (type === 'water') return 'i-lucide-droplets'
    if (type === 'fertilize') return 'i-lucide-flask-conical'
    return 'i-lucide-clipboard-check'
  }

  function requiresCheckInModal(type: CareTaskType) {
    return type === 'check_in'
  }

  function overdueDays(dueAt: string) {
    return taskOverdueDays(dueAt)
  }

  function fertilizeWithWater(task: CareTask, pendingTasks: CareTask[]) {
    if (task.type !== 'fertilize') return false
    return pendingTasks.some(
      other => other.plant_id === task.plant_id
        && other.type === 'water'
        && isSameCalendarDay(other.due_at, task.due_at)
    )
  }

  function overdueLabel(dueAt: string) {
    const days = taskOverdueDays(dueAt)
    if (days <= 0) return ''
    if (days === 1) return t('care.overdueOne')
    return t('care.overdueMany', { days })
  }

  function taskDueLabel(dueAt: string) {
    const overdue = taskOverdueDays(dueAt)
    if (overdue > 0) return overdueLabel(dueAt)
    if (overdue === 0) return t('care.dueToday')
    const days = -overdue
    if (days === 1) return t('care.dueTomorrow')
    return t('care.dueInDays', { days })
  }

  return {
    deleteOverlappingPendingTasks,
    fetchTodayTasks,
    fetchTodayCompletedTasks,
    fetchUpcomingTasks,
    fetchPlantPendingTasks,
    fetchCareHistory,
    fetchTasksInRange,
    fetchResolvedTasksInRange,
    createAdvanceTask,
    hasPendingTaskDueToday,
    completeTask,
    skipTask,
    postponeTask,
    taskLabel,
    taskIcon,
    requiresCheckInModal,
    overdueDays,
    overdueLabel,
    taskDueLabel,
    fertilizeWithWater
  }
}
