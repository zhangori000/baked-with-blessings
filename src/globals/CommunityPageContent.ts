import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const COMMUNITY_PAGE_CONTENT_DEFAULTS = {
  eyebrow: 'POST-IT WALL',
  title: 'Community',
  summary:
    "Tiny letters from people who just ordered with us. After every order, we ask the customer if they want to leave a note for the world — what they got, what they were thinking. Hover, react, scroll. We are limit testing this page; future versions will have more rooms.",
} as const

export const CommunityPageContent: GlobalConfig = {
  slug: 'community-page-content',
  label: 'Community Page Content',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Hero copy shown at the top of /community. Edit here to change what visitors read above the Post-it Wall, without a code change.',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: {
        description: 'Small uppercase label above the title (1–4 words).',
      },
      defaultValue: COMMUNITY_PAGE_CONTENT_DEFAULTS.eyebrow,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Large headline shown in the hero.',
      },
      defaultValue: COMMUNITY_PAGE_CONTENT_DEFAULTS.title,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description:
          'Short paragraph below the title that sets expectations for the page (what it is for, that it is experimental, etc.).',
      },
      defaultValue: COMMUNITY_PAGE_CONTENT_DEFAULTS.summary,
    },
  ],
}
