import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { DISCUSSION_TENANT_ID } from '../types'
import { authenticatedOnly } from './access'

export const AwarenessMarks: CollectionConfig = {
  slug: 'awareness-marks',
  access: {
    create: authenticatedOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['node', 'reactionType', 'user', 'visitorKey', 'createdAt'],
    group: 'Discussion Graph',
    useAsTitle: 'id',
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
      name: 'node',
      type: 'relationship',
      index: true,
      relationTo: 'discussion-nodes',
      required: true,
    },
    {
      name: 'reactionType',
      type: 'select',
      defaultValue: 'awareness',
      index: true,
      options: [
        {
          label: 'Awareness',
          value: 'awareness',
        },
        {
          label: 'Cry',
          value: 'cry',
        },
        {
          label: 'Wilted rose',
          value: 'wiltedRose',
        },
      ],
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: ['admins', 'customers'],
    },
    {
      name: 'visitorKey',
      type: 'text',
      admin: {
        description: 'Anonymous browser key used for testing awareness marks.',
      },
      index: true,
    },
    {
      name: 'dedupeKey',
      type: 'text',
      admin: {
        description: 'Unique node/reaction/user key used to make repeated reactions idempotent.',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      unique: true,
    },
  ],
  timestamps: true,
}
