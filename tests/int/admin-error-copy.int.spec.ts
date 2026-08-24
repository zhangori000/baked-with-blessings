import { explainAdminError } from '@/utilities/adminErrorCopy'
import { describe, expect, it } from 'vitest'

describe('admin error copy', () => {
  it('tells staff when preview is missing a Payload secret', () => {
    expect(explainAdminError('Error: missing secret key. A secret key is needed to secure Payload.')).toContain(
      'PAYLOAD_SECRET',
    )
  })

  it('tells staff when preview cannot reach its own database', () => {
    expect(explainAdminError('connect ECONNREFUSED 127.0.0.1:5432')).toContain('preview Neon')
    expect(explainAdminError('connect ECONNREFUSED 127.0.0.1:5432')).toContain('Do not point preview at production')
  })

  it('tells staff when the preview schema is missing', () => {
    expect(explainAdminError('relation "admins" does not exist')).toContain('preview migrations')
  })

  it('tells staff when the admins collection is missing from the login config', () => {
    expect(explainAdminError('Admin user collection "admins" is missing from the client config.')).toContain(
      'admins collection must stay visible',
    )
  })
})
