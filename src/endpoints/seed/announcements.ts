import type { Payload, PayloadRequest } from 'payload'

/**
 * Source of truth for the seeded announcement(s) — shared by the local seed and
 * the `sync:announcement` script so the two never drift.
 *
 * Announcements are OWNER-MANAGED day to day (edit them in the admin panel under
 * Announcements). This only sets a sensible starting point on a fresh database;
 * do NOT wire it into a recurring job, or it will clobber the owner's latest note.
 */
type AnnouncementSeedItem = {
  archived?: boolean
  message: string
  pinned: boolean
  postedOn: string
  title: string
}

export const emailListAnnouncement: AnnouncementSeedItem = {
  archived: false,
  pinned: true,
  postedOn: '2026-09-25T12:00:00.000Z',
  title: 'How to join our email list',
  message: [
    'Get an email when we have new flavors, market dates, or a new flavor vote. It takes about a minute.',
    '',
    'If you don’t have an account yet:',
    '1. Tap the person icon at the top right of this page. On a computer, it says Account.',
    '2. Tap Create an account.',
    '3. Type your email address, then tap Send code.',
    '4. While the code is on its way, type a password under Password, then type it again under Verify password.',
    '5. Open the email from us and type the 6-digit code under Verification code.',
    '6. If your account isn’t created on its own, tap Create account.',
    'New accounts with an email join the list automatically.',
    '',
    'If you already have an account:',
    '1. Tap the person icon and sign in.',
    '2. Tap Account settings.',
    '3. Under Emails, check “Email me flavor drops, market dates, and announcements.” It saves right away.',
    'If you can’t check the box, your account doesn’t have an email yet. Type your email under Email Address on the same page, tap Update Account, then check the box.',
    '',
    'Every email has an unsubscribe link at the bottom. Order receipts and login codes still arrive either way. If you don’t see our emails, check your spam or promotions folder.',
  ].join('\n'),
}

export const flavorVoteAnnouncement: AnnouncementSeedItem = {
  archived: false,
  pinned: false,
  postedOn: '2026-09-25T12:00:00.000Z',
  title: 'New: help pick our flavors every week',
  message: [
    'We’re starting a weekly flavor vote, so you can help decide what we bake.',
    '',
    'How it works:',
    '1. When a vote is open, go to bakedwithblessings.com/vote. You can also find it in the menu at the top of the site.',
    '2. You get 3 cookie tokens. Put all 3 on one flavor, or spread them across a few.',
    '3. Tap Submit my votes. You can change your votes until voting closes on Sunday at 8 PM Central time.',
    '4. Want a flavor we don’t make yet? Type it in the “What flavor would you love to see?” box.',
    'We use the results to choose the next week’s flavors.',
    '',
    'Here is what we’re baking this first week:',
    '• Red Velvet Cheesecake',
    '• S’mores',
    '• Biscoff',
    '• Roasted Pesto Focaccia',
    '',
    'We’ll email everyone on our list when the first vote opens. To join, see the pinned note “How to join our email list.”',
  ].join('\n'),
}

export const announcementItems: AnnouncementSeedItem[] = [
  emailListAnnouncement,
  flavorVoteAnnouncement,
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
