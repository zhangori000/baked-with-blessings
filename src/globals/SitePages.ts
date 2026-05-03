import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const SITE_PAGES_DEFAULTS = {
  blessingsNetworkEnabled: true,
  blogEnabled: true,
  communityEnabled: true,
  discussionBoardEnabled: true,
  reviewsEnabled: true,
} as const

export const SitePages: GlobalConfig = {
  slug: 'site-pages',
  label: 'Site Pages',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Toggle individual public pages on or off. Disabling a page hides it from the Other Pages menu and 404s the route (and any sub-routes). New pages default to enabled.',
  },
  fields: [
    {
      name: 'communityEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Post-it Wall (/community)',
      admin: {
        description:
          'Untick to hide the Community Post-it Wall from the Other Pages menu and 404 the /community route.',
      },
    },
    {
      name: 'reviewsEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Reviews (/reviews)',
      admin: {
        description:
          'Untick to hide Reviews from the Other Pages menu and 404 the /reviews route.',
      },
    },
    {
      name: 'blogEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Blog (/blog)',
      admin: {
        description:
          'Untick to hide the Blog from the Other Pages menu and 404 the /blog route (including /blog/[slug]).',
      },
    },
    {
      name: 'discussionBoardEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Discussion Board (/discussion-board)',
      admin: {
        description:
          'Untick to hide the Discussion Board from the Other Pages menu and 404 the /discussion-board route.',
      },
    },
    {
      name: 'blessingsNetworkEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Community Advice (/blessings-network)',
      admin: {
        description:
          'Untick to hide Community Advice from the Other Pages menu and 404 the /blessings-network route.',
      },
    },
  ],
}
