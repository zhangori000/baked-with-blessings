import { describe, expect, it } from 'vitest'

import {
  announcementItems,
  emailListAnnouncement,
  flavorVoteAnnouncement,
} from '@/endpoints/seed/announcements'

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

  it('pins step-by-step email list instructions that name the real buttons', () => {
    expect(announcementItems).toContain(emailListAnnouncement)
    expect(emailListAnnouncement.pinned).toBe(true)

    for (const label of [
      'Create an account',
      'Send code',
      'Verify password',
      'Verification code',
      'Account settings',
      'Email me flavor drops, market dates, and announcements',
      'Update Account',
    ]) {
      expect(emailListAnnouncement.message).toContain(label)
    }
  })

  it('announces the flavor vote with this first week’s lineup as a regular update', () => {
    expect(announcementItems).toContain(flavorVoteAnnouncement)
    expect(flavorVoteAnnouncement.pinned).toBe(false)
    expect(flavorVoteAnnouncement.message).toContain('bakedwithblessings.com/vote')

    for (const flavor of [
      'Red Velvet Cheesecake',
      'S’mores',
      'Biscoff',
      'Roasted Pesto Focaccia',
    ]) {
      expect(flavorVoteAnnouncement.message).toContain(flavor)
    }
  })
})
