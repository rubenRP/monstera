import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseAiJson } from './parseAiJson'

const schema = z.object({ summary: z.string() })

describe('parseAiJson', () => {
  it('parses fenced JSON', () => {
    expect(parseAiJson('Aquí tienes:\n```json\n{"summary":"ok"}\n```', schema)).toEqual({ summary: 'ok' })
  })

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseAiJson('{"summary": "sin cerrar', schema)).toBeNull()
    expect(parseAiJson('No puedo ayudar con eso.', schema)).toBeNull()
  })

  it('returns null when the shape does not match', () => {
    expect(parseAiJson('{"other": 1}', schema)).toBeNull()
  })
})
