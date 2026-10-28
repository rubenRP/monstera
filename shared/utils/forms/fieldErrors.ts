import type { ZodError } from 'zod'

/**
 * First issue per top-level field. Messages that are our i18n keys (errors.validation.*) are
 * kept; zod's built-in English messages are replaced by `fallbackKey` so the UI can translate.
 */
export function fieldErrorsFromZod(error: ZodError, fallbackKey: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field !== 'string' || out[field]) continue
    out[field] = issue.message.startsWith('errors.validation.') ? issue.message : fallbackKey
  }
  return out
}
