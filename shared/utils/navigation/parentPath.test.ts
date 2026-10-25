import { describe, expect, it } from 'vitest'
import { isTopLevelPath, parentPath } from './parentPath'

describe('parentPath', () => {
  it('goes one level up', () => {
    expect(parentPath('/plants/abc/edit')).toBe('/plants/abc')
    expect(parentPath('/plants/abc')).toBe('/plants')
    expect(parentPath('/plants/new')).toBe('/plants')
    expect(parentPath('/sites/xyz/edit')).toBe('/sites/xyz')
  })

  it('returns home for top-level sections', () => {
    expect(parentPath('/plants')).toBe('/')
    expect(parentPath('/')).toBe('/')
  })

  it('ignores query, hash and trailing slash', () => {
    expect(parentPath('/plants/abc/diagnose?x=1')).toBe('/plants/abc')
    expect(parentPath('/plants/abc/#history')).toBe('/plants')
  })
})

describe('isTopLevelPath', () => {
  it('detects main navigation sections', () => {
    expect(isTopLevelPath('/')).toBe(true)
    expect(isTopLevelPath('/calendar')).toBe(true)
    expect(isTopLevelPath('/plants/')).toBe(true)
    expect(isTopLevelPath('/plants/abc')).toBe(false)
  })
})
