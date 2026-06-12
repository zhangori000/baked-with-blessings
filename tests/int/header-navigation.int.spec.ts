import { describe, expect, it } from 'vitest'

import { buildHeaderNavigation, getEnabledHeaderAppPages } from '@/components/Header/constants'
import type { SitePagesFlags } from '@/utilities/getSitePages'

const sitePagesWithDraftAppsDisabled: SitePagesFlags = {
  blessingsNetworkEnabled: false,
  blogEnabled: false,
  communityEnabled: true,
  discussionBoardEnabled: false,
  featureRequestsEnabled: true,
  reviewsEnabled: true,
}

const sitePagesWithAllAppsDisabled: SitePagesFlags = {
  blessingsNetworkEnabled: false,
  blogEnabled: false,
  communityEnabled: false,
  discussionBoardEnabled: false,
  featureRequestsEnabled: false,
  reviewsEnabled: false,
}

describe('header navigation', () => {
  it('uses Site Pages toggles for mobile app cards', () => {
    const navigationItems = buildHeaderNavigation([], sitePagesWithDraftAppsDisabled)
    const appsItem = navigationItems.find((item) => item.kind === 'apps')

    expect(appsItem?.panel.cards.map((card) => card.href)).toEqual([
      '/contact',
      '/community',
      '/reviews',
      '/feature-requests',
    ])
  })

  it('uses the same enabled app routes for desktop and mobile', () => {
    const navigationItems = buildHeaderNavigation([], sitePagesWithDraftAppsDisabled)
    const appsItem = navigationItems.find((item) => item.kind === 'apps')
    const desktopRoutes = getEnabledHeaderAppPages(sitePagesWithDraftAppsDisabled).map(
      (page) => page.href,
    )

    expect(appsItem?.panel.cards.map((card) => card.href)).toEqual(desktopRoutes)
  })

  it('keeps only always-on pages when every toggleable app page is disabled', () => {
    const navigationItems = buildHeaderNavigation([], sitePagesWithAllAppsDisabled)
    const appsItem = navigationItems.find((item) => item.kind === 'apps')

    // Contact has no Site Pages toggle: it moved out of the main nav into
    // this panel, so it must survive even when every other app is off.
    expect(appsItem?.panel.cards.map((card) => card.href)).toEqual(['/contact'])
  })
})
