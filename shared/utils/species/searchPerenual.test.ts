import { describe, expect, it } from 'vitest'
import { buildPerenualSearchQueries } from './searchPerenual'

describe('buildPerenualSearchQueries', () => {
  it('includes kentia aliases for howea forsteriana', () => {
    const queries = buildPerenualSearchQueries('howea forsteriana')
    expect(queries).toContain('howea forsteriana')
    expect(queries).toContain('howea')
    expect(queries).toContain('kentia palm')
    expect(queries).toContain('kentia')
  })
})
