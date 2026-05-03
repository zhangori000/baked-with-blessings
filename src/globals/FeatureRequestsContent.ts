import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const FEATURE_REQUESTS_CONTENT_DEFAULTS = {
  eyebrow: 'TELL US WHAT TO BUILD',
  title: 'Request Features',
  summary:
    'Anything you want to see — pages, food, packaging, the way orders work, copy on the site, the way we treat your time. Public requests are encouraged so other people can rate them five stars and we can prioritize what the community actually wants. Want to keep it between us? Send it privately and only the bakery owner sees it.',
} as const

export const FeatureRequestsContent: GlobalConfig = {
  slug: 'feature-requests-content',
  label: 'Feature Requests Page Content',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Hero copy shown at the top of /feature-requests. Edit here to change what visitors read above the request composer.',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: FEATURE_REQUESTS_CONTENT_DEFAULTS.eyebrow,
      admin: {
        description: 'Small uppercase label above the title (1–4 words).',
      },
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: FEATURE_REQUESTS_CONTENT_DEFAULTS.title,
      admin: {
        description: 'Large headline shown in the hero.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      defaultValue: FEATURE_REQUESTS_CONTENT_DEFAULTS.summary,
      admin: {
        description:
          'Short paragraph that explains what feature requests are, that public posts are encouraged, and that pseudonyms / private DMs are options.',
      },
    },
  ],
}
