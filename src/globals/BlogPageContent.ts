import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const BLOG_PAGE_CONTENT_DEFAULTS = {
  eyebrow: 'WHILE YOU WAIT',
  title: 'Blog',
  summary:
    "Stuff to read (or write) while we're baking. We are limit testing this page — it's a sketch of something bigger. Someday: every purchase = one ticket to publish your own post here. Someday after that: a physical room with drinks, food, and people swapping ideas. For now, just a few notes and the start of a place.",
} as const

export const BlogPageContent: GlobalConfig = {
  slug: 'blog-page-content',
  label: 'Blog Page Content',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Hero copy shown at the top of /blog. Edit here to change what visitors read while they wait, without a code change.',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: BLOG_PAGE_CONTENT_DEFAULTS.eyebrow,
      admin: {
        description: 'Small uppercase label above the title (1–4 words).',
      },
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: BLOG_PAGE_CONTENT_DEFAULTS.title,
      admin: {
        description: 'Large headline shown in the hero.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      defaultValue: BLOG_PAGE_CONTENT_DEFAULTS.summary,
      admin: {
        description:
          'Short paragraph below the title that sets expectations for the page (what it is for, that it is experimental, etc.).',
      },
    },
  ],
}
