import { describe, expect, it } from 'vitest'

import { announcementItems } from '@/endpoints/seed/announcements'

describe('seeded announcement content', () => {
  it('shows the correct Wednesday farmers market hours', () => {
    const farmersMarket = announcementItems.find((item) =>
      item.title.toLowerCase().includes('farmers market'),
    )

    expect(farmersMarket?.message).toContain('2pm to 6pm')
    expect(farmersMarket?.message).not.toContain('9am to 1pm')
  })
})
