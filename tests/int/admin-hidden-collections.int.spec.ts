import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  isCollectionHidden,
  relatedEcommerceCollectionSlugs,
} from '@/utilities/adminHiddenCollections'
import { describe, expect, it } from 'vitest'

const readSrc = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('admin collection visibility', () => {
  it('does not hide ecommerce collections that products still relate to', () => {
    const pluginsSource = readSrc('src/plugins/index.ts')

    expect(pluginsSource).not.toMatch(/hidden:\s*true/)

    for (const slug of relatedEcommerceCollectionSlugs) {
      expect(
        isCollectionHidden({
          admin: { hidden: true },
          slug,
        }),
      ).toBe(true)
    }
  })

  it('keeps the admins auth collection visible', () => {
    const adminsSource = readSrc('src/collections/Admins/index.ts')

    expect(adminsSource).toMatch(/slug:\s*'admins'/)
    expect(adminsSource).not.toMatch(/hidden:\s*true/)
  })
})
