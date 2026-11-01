import { z } from 'zod'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

const bodySchema = z.object({ endpoint: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.PUSH_INVALID_SUBSCRIPTION)
  }

  const user = requireAuthUser(event)
  const supabase = getServiceSupabase()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', parsed.data.endpoint)
    .eq('user_id', user.id)
  if (error) {
    throwApiError(500, API_ERROR_CODES.PUSH_SAVE_FAILED)
  }
  return { ok: true }
})
