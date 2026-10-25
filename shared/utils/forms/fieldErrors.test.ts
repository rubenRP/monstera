import { describe, expect, it } from 'vitest'
import { plantFormSchema } from '../plants/schemas'
import { fieldErrorsFromZod } from './fieldErrors'

describe('fieldErrorsFromZod', () => {
  it('maps the first issue of each field, translating zod defaults to the fallback key', () => {
    const parsed = plantFormSchema.safeParse({ name: '', window_distance_cm: 900, pot_diameter_cm: -1 })
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(fieldErrorsFromZod(parsed.error, 'errors.validation.invalidValue')).toEqual({
      name: 'errors.validation.plantNameRequired',
      window_distance_cm: 'errors.validation.invalidValue',
      pot_diameter_cm: 'errors.validation.invalidValue'
    })
  })
})
