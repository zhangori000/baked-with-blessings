import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { DISCUSSION_TENANT_ID, edgeTypes } from '../types'
import { authenticatedOnly } from './access'

export const DiscussionEdges: CollectionConfig = {
  slug: 'discussion-edges',
  access: {
    create: authenticatedOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['type', 'fromNode', 'toNode', 'createdAt'],
    group: 'Discussion Graph',
    useAsTitle: 'type',
  },
  fields: [
    {
      name: 'tenantId',
      type: 'text',
      defaultValue: DISCUSSION_TENANT_ID,
      index: true,
      required: true,
    },
    {
      name: 'rootNode',
      type: 'relationship',
      index: true,
      relationTo: 'discussion-nodes',
      required: true,
    },
    {
      name: 'fromNode',
      type: 'relationship',
      index: true,
      relationTo: 'discussion-nodes',
      required: true,
    },
    {
      name: 'toNode',
      type: 'relationship',
      index: true,
      relationTo: 'discussion-nodes',
      required: true,
    },
    {
      name: 'toBlockIds',
      type: 'array',
      fields: [
        {
          name: 'blockId',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'type',
      type: 'select',
      options: edgeTypes.map((value) => ({ label: value, value })),
      required: true,
    },
  ],
  timestamps: true,
}
