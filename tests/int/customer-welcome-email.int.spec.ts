import { describe, expect, it } from 'vitest'

import { buildCustomerWelcomeEmail } from '@/utilities/email/sendCustomerWelcomeEmail'

const build = (name?: string) =>
  buildCustomerWelcomeEmail({
    accountURL: 'https://example.test/account',
    companyName: 'Baked with Blessings',
    name,
  })

describe('buildCustomerWelcomeEmail', () => {
  it('is a real, warm welcome (not the old placeholder) pointing at the bakery inbox', () => {
    const { html, subject, text } = build('Kamalesh')

    expect(subject).toBe('Welcome to Baked with Blessings!')
    expect(text).toContain('Hi Kamalesh,')
    expect(text).not.toMatch(/placeholder/i)
    expect(text).toContain('bakedwithblessings@gmail.com')
    expect(html).toContain('mailto:bakedwithblessings@gmail.com')
    // Stays consistent with the site-wide em-dash cleanup.
    expect(text).not.toContain('—')
    expect(html).not.toContain('—')
  })

  it('falls back to a generic greeting when no name is provided', () => {
    expect(build().text).toContain('Hi,')
  })
})
