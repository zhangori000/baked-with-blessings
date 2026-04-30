import type { CollectionConfig, CollectionSlug } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  BLESSINGS_NETWORK_TENANT_ID,
  blessingsNetworkPublicStatuses,
} from '@/features/blessings-network/types'

import { adminOrPublishedNetworkOwnerPost } from './access'

export const BlessingsNetworkOwnerPosts: CollectionConfig = {
  slug: 'blessings-network-owner-posts',
  labels: {
    plural: 'Owner insights',
    singular: 'Owner insight',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedNetworkOwnerPost,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'owner', 'topic', 'publicStatus', 'createdAt'],
    group: 'Community Advice',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'tenantId',
      type: 'text',
      defaultValue: BLESSINGS_NETWORK_TENANT_ID,
      index: true,
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      index: true,
      relationTo: 'blessings-network-owners' as CollectionSlug,
      required: true,
    },
    {
      name: 'publicStatus',
      type: 'select',
      defaultValue: 'under_review',
      index: true,
      options: blessingsNetworkPublicStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'topic',
      type: 'text',
      admin: {
        description: 'Short public grouping, for example leases, equipment, staffing, or pricing.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'practicalTakeaway',
      type: 'textarea',
      admin: {
        description: 'Short public summary of the most useful lesson in this owner insight.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      admin: {
        description: 'Lower numbers appear first in Owner Insights.',
        position: 'sidebar',
      },
      defaultValue: 100,
      min: 0,
    },
    {
      name: 'submittedByEmail',
      type: 'email',
      admin: {
        description: 'Private verification email from the owner insight form.',
        position: 'sidebar',
      },
    },
    {
      name: 'submissionKey',
      type: 'text',
      admin: {
        description: 'Stable key used to make owner insight submission retries idempotent.',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      unique: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      admin: {
        description: 'Private note for verification, edits, or declined submissions.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
