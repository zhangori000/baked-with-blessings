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

  it('does not fall back to a disabled app route when every app page is disabled', () => {
    const navigationItems = buildHeaderNavigation([], sitePagesWithAllAppsDisabled)
    const appsItem = navigationItems.find((item) => item.kind === 'apps')

    expect(appsItem?.panel.cards).toEqual([])
  })
})
