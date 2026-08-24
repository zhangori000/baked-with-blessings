import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Daily work',
    description:
      'Menu sections such as cookies, trays, and catering. This week\'s specials vs always-available is not here — that comes from Cookie lineups and each cookie\'s "Where it lives" field.',
    defaultColumns: ['title', 'menuOrder'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'menuOrder',
      type: 'number',
      defaultValue: 100,
      admin: {
        description:
          'Lower values appear first in /menu sections. Use this to control category order from Admin.',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
