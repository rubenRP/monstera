import { extractJsonFromText } from './prompts'

export function parseAgentJson(text: string): unknown | null {
  const raw = extractJsonFromText(text)
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}
