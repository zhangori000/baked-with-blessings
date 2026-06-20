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
    linkHref: '/menu',
    linkLabel: 'Preorder now',
    message:
      'Find us at the downtown farmers market every Wednesday, 9am to 1pm, now through September. Preorder by Tuesday night and your order will be waiting at the stand with your name on it.',
    title: 'Farmers market — every Wednesday through September',
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
