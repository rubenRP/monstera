import type { H3Event } from 'h3'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

/**
 * Requires CRON_SECRET: `Authorization: Bearer <secret>` (sent by Vercel cron) or `x-cron-secret`.
 * The `x-vercel-cron` header alone is not trusted — any client can send it.
 */
export function assertCronAuthorized(event: H3Event): void {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader === `Bearer ${cronSecret}`) return
    if (getHeader(event, 'x-cron-secret') === cronSecret) return
  }

  throwApiError(403, API_ERROR_CODES.CRON_FORBIDDEN)
}
