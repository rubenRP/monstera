import type { ZodType } from 'zod'
import { extractJsonFromText } from './prompts'

/** Parses the JSON block of an AI answer and validates it; null when missing, malformed or invalid. */
export function parseAiJson<T>(text: string, schema: ZodType<T>): T | null {
  let raw: unknown
  try {
    raw = JSON.parse(extractJsonFromText(text))
  } catch {
    return null
  }
  const parsed = schema.safeParse(raw)
  return parsed.success ? parsed.data : null
}
