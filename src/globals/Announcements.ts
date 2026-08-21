import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Announcements: GlobalConfig = {
  slug: 'announcements',
  label: 'Announcements',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Daily work',
    description:
      'These appear under the ANNOUNCEMENTS button in the site header on every page (it replaced Contact in the main nav; Contact now lives under Other pages). Visitors see a red dot on the button until they open the panel — saving any change here shows the dot again.',
  },
  fields: [
    {
      name: 'items',
      label: 'Announcements (top of this list shows first)',
      type: 'array',
      admin: {
        description:
          'Drag to reorder. Keep these short and current: bake days, market dates, pickup windows. Delete old ones so the list stays fresh.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'The headline customers see, for example "Farmers market this Saturday!"',
          },
        },
        {
          name: 'message',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'A few friendly sentences: where, when, what is available, how to claim an order.',
          },
        },
        {
          name: 'linkLabel',
          type: 'text',
          admin: {
            description: 'Optional button text, for example "Preorder now". Leave empty for no button.',
          },
        },
        {
          name: 'linkHref',
          type: 'text',
          admin: {
            description: 'Where the optional button goes, for example /menu. Required if button text is set.',
          },
        },
      ],
    },
  ],
}
