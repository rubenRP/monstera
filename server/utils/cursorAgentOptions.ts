import type { AgentOptions } from '@cursor/sdk'

const CURSOR_MODEL = { id: 'composer-2' } as const

function getCursorAgentRuntime(): 'local' | 'cloud' {
  const explicit = process.env.CURSOR_AGENT_RUNTIME?.toLowerCase()
  if (explicit === 'cloud' || explicit === 'local') return explicit
  // Local agents need a Cursor executor on the host; Vercel functions have none.
  if (process.env.VERCEL) return 'cloud'
  return 'local'
}

export function buildCursorAgentOptions(apiKey: string): AgentOptions {
  const base = { apiKey, model: CURSOR_MODEL }
  if (getCursorAgentRuntime() === 'cloud') {
    return { ...base, cloud: {} }
  }
  return { ...base, local: { cwd: process.cwd() } }
}
