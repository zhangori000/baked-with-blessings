import type { Payload, PayloadRequest } from 'payload'

/**
 * Source of truth for the seeded announcement(s) — shared by the local seed and
 * the `sync:announcement` script so the two never drift.
 *
 * Announcements are OWNER-MANAGED day to day (edit them in the admin panel under
 * Announcements). This only sets a sensible starting point on a fresh database;
 * do NOT wire it into a recurring job, or it will clobber the owner's latest note.
 */
export const announcementItems = [
  {
    pinned: true,
    postedOn: '2026-09-20T12:00:00.000Z',
    title: 'The owners are at Carleton',
    message:
      'The bakers are now in college at Carleton College in Northfield, Minnesota. We will be back at the Minneapolis farmers market November 24 through January 3.',
  },
  {
    archived: true,
    pinned: false,
    postedOn: '2026-09-18T12:00:00.000Z',
    title: 'Farmers market — every Wednesday through September',
    message:
      'Find us at the downtown farmers market every Wednesday, 2pm to 6pm, now through September. Come say hello at the stand.',
  },
]

export const seedAnnouncements = async ({
  payload,
  req,
}: {
  payload: Payload
  req?: PayloadRequest
}): Promise<void> => {
  await payload.updateGlobal({
    slug: 'announcements',
    data: { items: announcementItems },
    overrideAccess: true,
    req,
  })
}
