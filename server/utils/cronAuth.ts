import type { H3Event } from 'h3'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

/** Vercel cron: x-vercel-cron, or Authorization Bearer CRON_SECRET when set. Manual: x-cron-secret. */
export function assertCronAuthorized(event: H3Event): void {
  if (getHeader(event, 'x-vercel-cron')) return

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader === `Bearer ${cronSecret}`) return
    if (getHeader(event, 'x-cron-secret') === cronSecret) return
  }

  throwApiError(403, API_ERROR_CODES.CRON_FORBIDDEN)
}
