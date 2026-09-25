import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { FLAVOR_IDEA_MAX_LENGTH } from '@/features/flavor-polls/constants'

export const FlavorPollVotes: CollectionConfig = {
  slug: 'flavor-poll-votes',
  labels: {
    plural: 'Flavor Vote Ballots',
    singular: 'Flavor Vote Ballot',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['poll', 'flavorIdea', 'updatedAt'],
    group: 'Content',
    hidden: true,
  },
  indexes: [
    {
      fields: ['poll', 'voterKey'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'poll',
      type: 'relationship',
      index: true,
      relationTo: 'flavor-polls',
      required: true,
    },
    {
      name: 'voterKey',
      type: 'text',
      required: true,
    },
    {
      name: 'picks',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
        {
          name: 'count',
          type: 'number',
          min: 1,
          required: true,
        },
      ],
    },
    {
      name: 'flavorIdea',
      type: 'text',
      maxLength: FLAVOR_IDEA_MAX_LENGTH,
    },
  ],
}
