import { describe, expect, it } from 'vitest'

import {
  FlavorNudgeError,
  normalizeNudgeEmail,
  parseNudgeProductIDs,
} from '@/features/flavor-nudges/validation'

describe('parseNudgeProductIDs', () => {
  const allowed = new Set([3, 7, 9])

  it('keeps only old flavors and drops duplicates', () => {
    expect(parseNudgeProductIDs([7, '3', 7, 42, 'x', 3.5], allowed)).toEqual([7, 3])
  })

  it('rejects an empty or unknown pick', () => {
    expect(() => parseNudgeProductIDs([], allowed)).toThrow(FlavorNudgeError)
    expect(() => parseNudgeProductIDs([42], allowed)).toThrow(FlavorNudgeError)
    expect(() => parseNudgeProductIDs('7', allowed)).toThrow(FlavorNudgeError)
  })
})

describe('normalizeNudgeEmail', () => {
  it('treats a blank email as none', () => {
    expect(normalizeNudgeEmail('   ')).toBeNull()
    expect(normalizeNudgeEmail(undefined)).toBeNull()
  })

  it('trims and lowercases a real email', () => {
    expect(normalizeNudgeEmail('  Fan@Example.COM ')).toBe('fan@example.com')
  })

  it('rejects something that is not an email', () => {
    expect(() => normalizeNudgeEmail('not-an-email')).toThrow(FlavorNudgeError)
    expect(() => normalizeNudgeEmail('fan@gmail.c')).toThrow(FlavorNudgeError)
    expect(() => normalizeNudgeEmail('fan@gmail..com')).toThrow(FlavorNudgeError)
    expect(() => normalizeNudgeEmail('fan.@gmail.com')).toThrow(FlavorNudgeError)
  })
})
