import type { CareTask, PlantCheckIn } from '#shared/types/database'
import type { CheckInFormInput } from '#shared/utils/checkIn/schemas'

export function usePlantCheckIns() {
  const supabase = useSupabaseClient()
  const { t } = useI18n()
  const { requireUserId } = useRequireUserId()
  const { uploadPhoto } = usePlants()
  const { rescheduleCheckIn } = useAdaptiveWatering()
  const { deleteOverlappingPendingTasks } = useCareTasks()

  async function fetchCheckInHistory(plantId: string, limit = 50) {
    const { data, error } = await supabase
      .from('plant_check_ins')
      .select('*')
      .eq('plant_id', plantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as PlantCheckIn[]
  }

  async function submitCheckIn(
    task: CareTask,
    form: CheckInFormInput,
    photoFile?: File
  ): Promise<PlantCheckIn> {
    const uid = await requireUserId()
    const now = new Date().toISOString()

    await deleteOverlappingPendingTasks(task, task.id)

    let photoPath: string | null = null
    if (photoFile) {
      photoPath = await uploadPhoto(photoFile, task.plant_id)
    }

    const { data: checkIn, error: checkInError } = await supabase
      .from('plant_check_ins')
      .insert({
        plant_id: task.plant_id,
        user_id: uid,
        care_task_id: task.id,
        health_status: form.health_status,
        health_status_note: form.health_status_note || null,
        height_cm: form.height_cm ?? null,
        new_leaves: form.new_leaves,
        dropped_leaves: form.dropped_leaves,
        flowering: form.flowering,
        size_changed: form.size_changed,
        notes: form.notes || null,
        photo_path: photoPath
      })
      .select('*')
      .single()
    if (checkInError) throw checkInError

    const { error: plantError } = await supabase
      .from('plants')
      .update({
        health_status: form.health_status,
        health_status_note: form.health_status_note || null,
        health_status_updated_at: now,
        last_check_in_at: now,
        updated_at: now,
        ...(form.height_cm != null
          ? { height_cm: form.height_cm, height_updated_at: now }
          : {}),
        ...(photoPath ? { photo_path: photoPath } : {})
      })
      .eq('id', task.plant_id)
    if (plantError) throw plantError

    const { error: taskError } = await supabase
      .from('care_tasks')
      .update({ status: 'done', completed_at: now })
      .eq('id', task.id)
    if (taskError) throw taskError

    await rescheduleCheckIn(task.plant_id)

    return checkIn as PlantCheckIn
  }

  function observationSummary(checkIn: PlantCheckIn): string[] {
    const parts: string[] = []
    if (checkIn.new_leaves) parts.push(t('checkIn.newLeaves'))
    if (checkIn.dropped_leaves) parts.push(t('checkIn.droppedLeaves'))
    if (checkIn.flowering) parts.push(t('checkIn.flowering'))
    if (checkIn.size_changed) parts.push(t('checkIn.sizeChanged'))
    return parts
  }

  return {
    fetchCheckInHistory,
    submitCheckIn,
    observationSummary
  }
}

export type CareHistoryEntry
  = | { kind: 'task', at: string, task: CareTask }
    | { kind: 'check_in', at: string, checkIn: PlantCheckIn }

export function mergeCareHistory(
  tasks: CareTask[],
  checkIns: PlantCheckIn[]
): CareHistoryEntry[] {
  const entries: CareHistoryEntry[] = [
    ...tasks
      .filter(t => t.completed_at)
      .map(t => ({ kind: 'task' as const, at: t.completed_at!, task: t })),
    ...checkIns.map(c => ({ kind: 'check_in' as const, at: c.created_at, checkIn: c }))
  ]
  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return entries
}
