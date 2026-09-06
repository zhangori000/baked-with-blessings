import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AUTH_COLLECTION_SLUG,
  assertAdminAuthCollectionVisible,
  diagnoseAdminEnv,
} from '@/utilities/adminBoot'
import { describe, expect, it } from 'vitest'

describe('admin boot diagnosis', () => {
  it('requires PAYLOAD_SECRET and a database URL', () => {
    expect(diagnoseAdminEnv({})?.message).toMatch(/missing secret key/)
    expect(
      diagnoseAdminEnv({
        PAYLOAD_SECRET: 'preview-only-secret-at-least-32-chars!!',
      })?.message,
    ).toBe('DATABASE_URL is not set')
    expect(
      diagnoseAdminEnv({
        DATABASE_URL: 'postgresql://preview:preview@example.neon.tech/preview',
        PAYLOAD_SECRET: 'preview-only-secret-at-least-32-chars!!',
      }),
    ).toBeNull()
  })

  it('accepts hosted Neon URLs when DATABASE_URL is a local leftover on Vercel', () => {
    expect(
      diagnoseAdminEnv({
        DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/baked_with_blessings',
        NEON_POSTGRES_URL: 'postgresql://preview:preview@example.neon.tech/preview',
        PAYLOAD_SECRET: 'preview-only-secret-at-least-32-chars!!',
        VERCEL: '1',
      }),
    ).toBeNull()
  })

  it('refuses a hidden or missing admins collection', () => {
    expect(() =>
      assertAdminAuthCollectionVisible({
        admin: { user: AUTH_COLLECTION_SLUG },
        collections: [],
      }),
    ).toThrow(/admins/)

    expect(() =>
      assertAdminAuthCollectionVisible({
        admin: { user: AUTH_COLLECTION_SLUG },
        collections: [{ admin: { hidden: true }, slug: 'admins' }],
      }),
    ).toThrow(/hidden/)

    expect(() =>
      assertAdminAuthCollectionVisible({
        admin: { user: AUTH_COLLECTION_SLUG },
        collections: [{ admin: { hidden: false }, slug: 'admins' }],
      }),
    ).not.toThrow()
  })

  it('keeps the payload layout and admin page on the standalone-shell path', () => {
    const layout = readFileSync(path.join(process.cwd(), 'src/app/(payload)/layout.tsx'), 'utf8')
    const page = readFileSync(
      path.join(process.cwd(), 'src/app/(payload)/admin/[[...segments]]/page.tsx'),
      'utf8',
    )

    expect(layout).toContain('getAdminShellState')
    expect(layout).toContain('AdminStandaloneDocument')
    expect(page).toContain('getAdminShellState')
    expect(page).toContain('AdminLoginPage')
  })
})
