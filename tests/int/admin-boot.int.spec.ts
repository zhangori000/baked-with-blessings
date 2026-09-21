import { applyOwnerAdminNav } from '@/utilities/adminNav'
import { assertAdminConfigReady, diagnoseAdminEnv } from '@/utilities/adminBoot'
import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'

describe('admin boot diagnostics', () => {
  it('flags a missing Payload secret without reading production', () => {
    const error = diagnoseAdminEnv({
      DATABASE_URL: 'postgresql://preview.example/db',
      PAYLOAD_SECRET: '',
    })

    expect(error?.message).toMatch(/missing secret/i)
  })

  it('flags a missing preview database URL', () => {
    const error = diagnoseAdminEnv({
      PAYLOAD_SECRET: 'preview-only-secret-at-least-32-chars-long',
    })

    expect(error?.message).toMatch(/DATABASE_URL/i)
  })

  it('accepts the owner nav config used by login', () => {
    const config = applyOwnerAdminNav({
      admin: { user: 'admins' },
      collections: [
        { slug: 'admins' },
        { slug: 'products' },
        { slug: 'variants' },
        { slug: 'discussion-nodes' },
      ],
      globals: [{ slug: 'header' }, { slug: 'mystery-setting' }],
    } as Config)

    expect(() => assertAdminConfigReady(config)).not.toThrow()
  })

  it('rejects a hidden or missing admins collection', () => {
    expect(() =>
      assertAdminConfigReady({
        admin: { user: 'admins' },
        collections: [{ admin: { hidden: true }, slug: 'admins' }],
      }),
    ).toThrow(/hidden/)

    expect(() =>
      assertAdminConfigReady({
        admin: { user: 'admins' },
        collections: [{ admin: {}, slug: 'products' }],
      }),
    ).toThrow(/missing from the client config/)
  })
})
