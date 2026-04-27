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
    group: 'Content',
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
