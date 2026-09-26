import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const FlavorNudges: CollectionConfig = {
  slug: 'flavor-nudges',
  labels: {
    plural: 'Bring-Back Requests',
    singular: 'Bring-Back Request',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['product', 'email', 'createdAt'],
    group: 'Content',
    hidden: true,
  },
  indexes: [
    {
      fields: ['product', 'voterKey'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'product',
      type: 'relationship',
      index: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'voterKey',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
    },
  ],
}
