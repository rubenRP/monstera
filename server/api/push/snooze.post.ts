import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { postponedDueAt } from '#shared/utils/care/postpone'
import { replacePendingCareTask } from '#shared/utils/care/pendingTask'

const bodySchema = z.object({ taskIds: z.array(z.string().uuid()).min(1).max(50) })

/**
 * "Tomorrow" action of the daily notification. Called from the service worker, which has
 * no access token, so auth comes from the Supabase session cookie.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED)
  }

  const supabase = getServiceSupabase()
  const { data: tasks, error } = await supabase
    .from('care_tasks')
    .select('id, plant_id, type, due_at')
    .in('id', parsed.data.taskIds)
    .eq('user_id', user.id)
    .eq('status', 'pending')
  if (error) throw error

  for (const task of tasks ?? []) {
    await replacePendingCareTask(supabase, task.plant_id, task.type, postponedDueAt(task.due_at, 1))
  }
  return { snoozed: tasks?.length ?? 0 }
})
