import type { CareTask, CareTaskType } from '#shared/types/database'
import { deduplicateOverlappingTasks } from '#shared/utils/care/deduplicateTasks'
import { nextTaskDue } from '#shared/utils/care/generateTasks'
import { taskOverdueDays } from '#shared/utils/care/taskDue'

export function useCareTasks() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { rescheduleWatering, countRecentWetSkips } = useAdaptiveWatering()

  async function dismissOverlappingPendingTasks(task: CareTask, exceptId: string) {
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { error } = await supabase
      .from('care_tasks')
      .update({ status: 'skipped', completed_at: new Date().toISOString() })
      .eq('plant_id', task.plant_id)
      .eq('type', task.type)
      .eq('status', 'pending')
      .lte('due_at', end.toISOString())
      .neq('id', exceptId)
    if (error) throw error
  }

  const taskSelect = '*, plant:plants(id, name, photo_path, health_status, site:sites(id, name))'

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
    return deduplicateOverlappingTasks((data ?? []) as CareTask[])
  }

  async function fetchTodayTasks() {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
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
    const { data, error } = await supabase
      .from('care_tasks')
      .select(taskSelect)
      .eq('status', 'pending')
      .gte('due_at', start.toISOString())
      .lte('due_at', end.toISOString())
      .order('due_at')
    if (error) throw error
    return deduplicateOverlappingTasks((data ?? []) as CareTask[])
  }

  async function completeTask(task: CareTask) {
    await dismissOverlappingPendingTasks(task, task.id)

    const now = new Date().toISOString()
    const { error: taskError } = await supabase
      .from('care_tasks')
      .update({ status: 'done', completed_at: now })
      .eq('id', task.id)
    if (taskError) throw taskError

    if (task.type === 'water') {
      await supabase
        .from('plants')
        .update({ last_watered_at: now })
        .eq('id', task.plant_id)

      await rescheduleWatering(task.plant_id, { wetSkipCountOverride: 0 })
      return
    }

    const { data: plant } = await supabase
      .from('plants')
      .select('fertilizing_interval_days')
      .eq('id', task.plant_id)
      .single()
    if (!plant) return

    const uid = user.value?.id
    if (!uid) return

    await supabase
      .from('plants')
      .update({ last_fertilized_at: now })
      .eq('id', task.plant_id)

    await supabase.from('care_tasks').insert({
      plant_id: task.plant_id,
      user_id: uid,
      type: 'fertilize',
      due_at: nextTaskDue(plant.fertilizing_interval_days, new Date(now)),
      status: 'pending'
    })
  }

  async function skipTask(task: CareTask, options?: { soilStillWet?: boolean }) {
    await dismissOverlappingPendingTasks(task, task.id)

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

    if (task.type === 'water') {
      const wetCount = await countRecentWetSkips(task.plant_id)
      const schedule = await rescheduleWatering(task.plant_id, {
        scheduleFromToday: true,
        wetSkipCountOverride: wetCount
      })
      return schedule.effectiveIntervalDays
    }

    const uid = user.value?.id
    if (!uid) return

    const { data: plant } = await supabase
      .from('plants')
      .select('fertilizing_interval_days')
      .eq('id', task.plant_id)
      .single()
    if (!plant) return

    await supabase.from('care_tasks').insert({
      plant_id: task.plant_id,
      user_id: uid,
      type: 'fertilize',
      due_at: nextTaskDue(plant.fertilizing_interval_days, new Date()),
      status: 'pending'
    })
  }

  const { t } = useI18n()

  function taskLabel(type: CareTaskType) {
    return type === 'water' ? t('care.taskWater') : t('care.taskFertilize')
  }

  function taskIcon(type: CareTaskType) {
    return type === 'water' ? 'i-lucide-droplets' : 'i-lucide-flask-conical'
  }

  function overdueDays(dueAt: string) {
    return taskOverdueDays(dueAt)
  }

  function overdueLabel(dueAt: string) {
    const days = taskOverdueDays(dueAt)
    if (days <= 0) return ''
    if (days === 1) return t('care.overdueOne')
    return t('care.overdueMany', { days })
  }

  return {
    fetchTodayTasks,
    fetchPlantPendingTasks,
    fetchCareHistory,
    fetchTasksInRange,
    completeTask,
    skipTask,
    taskLabel,
    taskIcon,
    overdueDays,
    overdueLabel
  }
}
