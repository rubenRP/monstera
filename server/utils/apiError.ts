import type { ApiErrorCode } from '#shared/utils/i18n/apiErrors'

export function throwApiError(
  statusCode: number,
  code: ApiErrorCode,
  extra?: Record<string, unknown>
): never {
  throw createError({
    statusCode,
    data: { code, ...extra }
  })
}
