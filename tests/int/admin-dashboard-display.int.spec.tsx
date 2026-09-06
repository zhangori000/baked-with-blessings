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
              customerEmail: 'test@example.com',
              customerName: 'Test customer',
              id: 10,
              itemsSummary: "1× S'mores",
              paymentLabel: 'Paid online',
              primaryCustomer: 'Test customer',
              secondaryCustomer: 'test@example.com',
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
    expect(container.textContent).toContain('Test customer')
    expect(container.textContent).toContain('test@example.com')
    expect(container.textContent).toContain("1× S'mores")
    expect(container.textContent).toContain('Paid online')
  })

  it('shows the live lineup cookie names for this week', () => {
    const { container } = render(
      <ActiveRotation
        state={{
          kind: 'active',
          rotation: {
            flavors: ["S'mores", 'Biscoff'],
            id: 22,
            title: 'September cookies',
          },
        }}
      />,
    )

    expect(container.textContent).toContain('Live now')
    expect(container.textContent).toContain('September cookies')
    expect(container.textContent).toContain("S'mores, Biscoff")
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/collections/flavor-rotations/22',
    )
  })
})
