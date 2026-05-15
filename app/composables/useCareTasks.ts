import type { CareTask, CareTaskType } from '#shared/types/database'
import { nextTaskDue } from '#shared/utils/care/generateTasks'

export function useCareTasks() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchTodayTasks() {
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('care_tasks')
      .select('*, plant:plants(id, name, photo_path, health_status, site:sites(id, name))')
      .eq('status', 'pending')
      .lte('due_at', end.toISOString())
      .order('due_at')
    if (error) throw error
    return (data ?? []) as CareTask[]
  }

  async function fetchTasksInRange(start: Date, end: Date) {
    const { data, error } = await supabase
      .from('care_tasks')
      .select('*, plant:plants(id, name, photo_path, health_status, site:sites(id, name))')
      .gte('due_at', start.toISOString())
      .lte('due_at', end.toISOString())
      .order('due_at')
    if (error) throw error
    return (data ?? []) as CareTask[]
  }

  async function completeTask(task: CareTask) {
    const now = new Date().toISOString()
    const { error: taskError } = await supabase
      .from('care_tasks')
      .update({ status: 'done', completed_at: now })
      .eq('id', task.id)
    if (taskError) throw taskError

    const { data: plant } = await supabase
      .from('plants')
      .select('*')
      .eq('id', task.plant_id)
      .single()

    if (!plant) return

    const uid = user.value?.id
    if (!uid) return

    if (task.type === 'water') {
      await supabase
        .from('plants')
        .update({ last_watered_at: now })
        .eq('id', task.plant_id)

      await supabase.from('care_tasks').insert({
        plant_id: task.plant_id,
        user_id: uid,
        type: 'water',
        due_at: nextTaskDue(plant.watering_interval_days, new Date(now)),
        status: 'pending'
      })
    } else {
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
  }

  async function skipTask(taskId: string) {
    const { error } = await supabase
      .from('care_tasks')
      .update({ status: 'skipped', completed_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) throw error
  }

  function taskLabel(type: CareTaskType) {
    return type === 'water' ? 'Riego' : 'Fertilización'
  }

  function taskIcon(type: CareTaskType) {
    return type === 'water' ? 'i-lucide-droplets' : 'i-lucide-flask-conical'
  }

  return {
    fetchTodayTasks,
    fetchTasksInRange,
    completeTask,
    skipTask,
    taskLabel,
    taskIcon
  }
}
