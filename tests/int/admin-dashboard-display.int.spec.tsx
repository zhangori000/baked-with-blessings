import { ActiveRotation } from '@/components/AdminDashboard/ActiveRotation'
import { AttentionOrders } from '@/components/AdminDashboard/AttentionOrders'
import { businessTimeZone } from '@/utilities/businessInfo'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/ui', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

afterEach(cleanup)

describe('admin dashboard order display', () => {
  it.each([
    ['2026-07-13T00:30:00.000Z', 'Jul 12'],
    ['2026-07-13T05:30:00.000Z', 'Jul 13'],
    ['2026-01-01T05:30:00.000Z', 'Dec 31'],
  ])('formats %s in the bakery business day', (createdAt, expectedDate) => {
    const { container } = render(
      <AttentionOrders
        state={{
          docs: [
            {
              amount: 1800,
              createdAt,
              customerName: 'Test customer',
              id: 10,
              status: 'processing',
            },
          ],
          kind: 'ready',
          totalDocs: 1,
        }}
      />,
    )

    const time = container.querySelector('time')
    expect(businessTimeZone).toBe('America/Chicago')
    expect(time?.textContent).toBe(expectedDate)
    expect(time?.getAttribute('datetime')).toBe(createdAt)
  })
})

describe('admin dashboard lineup display', () => {
  it('names the cookies on the active lineup', () => {
    const { container } = render(
      <ActiveRotation
        state={{
          flavorTitles: ['Biscoff', 'Dubai chocolate'],
          kind: 'active',
          rotation: { id: 22, title: 'July cookies' },
        }}
      />,
    )

    expect(container.textContent).toContain('July cookies')
    expect(container.textContent).toContain('Biscoff · Dubai chocolate')
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/collections/flavor-rotations/22',
    )
  })
})
