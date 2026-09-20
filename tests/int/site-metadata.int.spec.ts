import { describe, expect, it } from 'vitest'

import { defaultSocialImage } from '@/utilities/siteMetadata'

describe('default social image', () => {
  it('meets LinkedIn Open Graph minimums', () => {
    expect(defaultSocialImage.height).toBeGreaterThanOrEqual(627)
    expect(defaultSocialImage.type).toBe('image/png')
    expect(defaultSocialImage.url).toMatch(/\.png$/)
    expect(defaultSocialImage.width).toBeGreaterThanOrEqual(1200)
  })
})
