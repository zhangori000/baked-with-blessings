import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const DISCUSSION_BOARD_CONTENT_DEFAULTS = {
  eyebrow: 'THINK OUT LOUD',
  title: 'Discussion Board',
  summary:
    "A small space for questions, claims, and replies — meant for the in-between moment while your order's being made. We are limit testing this page. Eventually it's where the conversation continues offline too: at our future physical place, over good drinks and good food, talking through ideas together.",
} as const

export const DiscussionBoardContent: GlobalConfig = {
  slug: 'discussion-board-content',
  label: 'Discussion Board Content',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    description:
      'Hero copy shown at the top of /discussion-board. Edit here to change what visitors read while they wait, without a code change.',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: DISCUSSION_BOARD_CONTENT_DEFAULTS.eyebrow,
      admin: {
        description: 'Small uppercase label above the title (1–4 words).',
      },
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: DISCUSSION_BOARD_CONTENT_DEFAULTS.title,
      admin: {
        description: 'Large headline shown in the hero.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      defaultValue: DISCUSSION_BOARD_CONTENT_DEFAULTS.summary,
      admin: {
        description:
          'Short paragraph below the title that sets expectations for the page (what it is for, that it is experimental, etc.).',
      },
    },
  ],
}
