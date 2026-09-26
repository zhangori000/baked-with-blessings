import { explainAdminError } from '@/utilities/adminErrorCopy'
import { describe, expect, it } from 'vitest'

describe('admin error copy', () => {
  it('explains missing preview secrets without suggesting production values', () => {
    const copy = explainAdminError('missing secret key. A secret key is needed to secure Payload.')

    expect(copy).toMatch(/PAYLOAD_SECRET/)
    expect(copy).toMatch(/preview-only/)
    expect(copy).toMatch(/Do not copy production values/)
  })

  it('explains a missing preview database without pointing at production', () => {
    const copy = explainAdminError('DATABASE_URL is not set')

    expect(copy).toMatch(/preview/i)
    expect(copy).toMatch(/Do not point preview at production/)
  })

  it('explains a hidden admins collection as a code issue', () => {
    expect(
      explainAdminError('Admin user collection "admins" is hidden, so login cannot mount.'),
    ).toMatch(/admins collection/)
  })
})
