import { describe, expect, it } from 'vitest'

import { announcementItems } from '@/endpoints/seed/announcements'

describe('seeded announcement content', () => {
  it('shows the correct Wednesday farmers market hours', () => {
    const farmersMarket = announcementItems.find((item) =>
      item.title.toLowerCase().includes('farmers market'),
    )

    expect(farmersMarket?.message).toContain('2pm to 6pm')
    expect(farmersMarket?.message).not.toContain('9am to 1pm')
    expect(farmersMarket?.pinned).toBe(false)
    expect(farmersMarket?.archived).toBe(true)
    expect(farmersMarket).not.toHaveProperty('linkLabel')
  })

  it('pins the Carleton note and leaves weekly market news as a regular update', () => {
    const carleton = announcementItems.find((item) => item.title.toLowerCase().includes('carleton'))

    expect(carleton?.pinned).toBe(true)
    expect(carleton?.postedOn).toBeTruthy()
    expect(carleton?.message).toContain('Carleton College')
  })
})
