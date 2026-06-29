import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { SitePage } from '@/payload-types'

export type SitePagesFlags = {
  aboutEnabled: boolean
  blogEnabled: boolean
  communityEnabled: boolean
  discussionBoardEnabled: boolean
  blessingsNetworkEnabled: boolean
  featureRequestsEnabled: boolean
  reviewsEnabled: boolean
}

const SITE_PAGES_DEFAULTS: SitePagesFlags = {
  aboutEnabled: true,
  blessingsNetworkEnabled: false,
  blogEnabled: false,
  communityEnabled: true,
  discussionBoardEnabled: false,
  featureRequestsEnabled: true,
  reviewsEnabled: true,
}

const coerce = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

export const getSitePages = async (): Promise<SitePagesFlags> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const doc = (await payload.findGlobal({
      slug: 'site-pages',
      depth: 0,
    })) as Partial<SitePage>

    return {
      aboutEnabled: coerce(doc.aboutEnabled, SITE_PAGES_DEFAULTS.aboutEnabled),
      blessingsNetworkEnabled: coerce(
        doc.blessingsNetworkEnabled,
        SITE_PAGES_DEFAULTS.blessingsNetworkEnabled,
      ),
      blogEnabled: coerce(doc.blogEnabled, SITE_PAGES_DEFAULTS.blogEnabled),
      communityEnabled: coerce(doc.communityEnabled, SITE_PAGES_DEFAULTS.communityEnabled),
      discussionBoardEnabled: coerce(
        doc.discussionBoardEnabled,
        SITE_PAGES_DEFAULTS.discussionBoardEnabled,
      ),
      featureRequestsEnabled: coerce(
        doc.featureRequestsEnabled,
        SITE_PAGES_DEFAULTS.featureRequestsEnabled,
      ),
      reviewsEnabled: coerce(doc.reviewsEnabled, SITE_PAGES_DEFAULTS.reviewsEnabled),
    }
  } catch {
    return { ...SITE_PAGES_DEFAULTS }
  }
}
