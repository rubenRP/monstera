import type { H3Event } from 'h3'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

/**
 * Returns the signed-in Clerk user for this request or throws 401.
 * `@clerk/nuxt` validates the `Authorization: Bearer <session token>` header (or session cookie)
 * and exposes the result on `event.context.auth()`. Always filter user data by `user.id`.
 */
export function requireAuthUser(event: H3Event): { id: string } {
  const { userId } = event.context.auth()
  if (!userId) {
    const hasBearer = getHeader(event, 'authorization')?.startsWith('Bearer ')
    throwApiError(401, hasBearer ? API_ERROR_CODES.AUTH_INVALID_SESSION : API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  return { id: userId }
}
