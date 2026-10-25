import { Agent, type AgentOptions } from '@cursor/sdk'

const JSON_ONLY_INSTRUCTION = 'Responde ÚNICAMENTE con el JSON, sin texto adicional.'

/** Second attempt when the first answer was not valid JSON. Returns '' on any failure. */
export async function retryAgentForJson(
  promptText: string,
  agentOptions: AgentOptions
): Promise<string> {
  try {
    const retry = await Agent.prompt(`${promptText}\n\n${JSON_ONLY_INSTRUCTION}`, agentOptions)
    if (retry.status === 'error') {
      console.error('Cursor JSON retry failed:', retry.id)
      return ''
    }
    return retry.result ?? ''
  } catch (e) {
    console.error('Cursor JSON retry error:', e instanceof Error ? e.message : String(e))
    return ''
  }
}
