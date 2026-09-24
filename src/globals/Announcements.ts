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
          'Drag to reorder regular notes. Pinned notes always sit at the top of the inbox. Archive a note to hide it from the website and keep the row. Delete only if you do not need the record.',
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
            description: 'A few friendly sentences. No sales button is shown on the site.',
          },
        },
        {
          name: 'postedOn',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'The date customers see on this note.',
          },
        },
        {
          name: 'pinned',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Keep this at the top of the inbox with a pin. Use for lasting news, not weekly flavor notes.',
          },
        },
        {
          name: 'archived',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Hide this note from the website. The row stays here so you can look it up later.',
          },
        },
        {
          name: 'linkLabel',
          type: 'text',
          admin: {
            hidden: true,
          },
        },
        {
          name: 'linkHref',
          type: 'text',
          admin: {
            hidden: true,
          },
        },
      ],
    },
  ],
}
