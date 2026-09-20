export const bakerDailyWorkGroup = 'Daily work'
export const bakerAdvancedGroup = 'Advanced'

export const cookieLineupLabels = {
  plural: 'Cookie lineups',
  singular: 'Cookie lineup',
} as const

export const cookiesAndMenuLabels = {
  plural: 'Cookies and menu',
  singular: 'Cookie',
} as const

export const cookieLineupListPath = '/admin/collections/flavor-rotations'
export const cookiesAndMenuListPath = '/admin/collections/products'

export const noActiveLineupError =
  'No cookie lineup is live right now. Open Cookie lineups, set one to Live now, then try again.'

export const lastCookieInLineupError =
  "This is the only cookie in this week's specials. Add another cookie on Cookie lineups first, then move this one."

export const multipleActiveLineupsError =
  'Only one cookie lineup can be live. Archive the current live lineup first, then set this one to Live now.'
