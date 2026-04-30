import type { CollectionConfig, CollectionSlug } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  BLESSINGS_NETWORK_TENANT_ID,
  blessingsNetworkPublicStatuses,
} from '@/features/blessings-network/types'

import { adminOrPublishedNetworkAnswer } from './access'

export const BlessingsNetworkAnswers: CollectionConfig = {
  slug: 'blessings-network-answers',
  labels: {
    plural: 'Advice replies',
    singular: 'Advice reply',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedNetworkAnswer,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['question', 'owner', 'publicStatus', 'createdAt'],
    group: 'Community Advice',
    useAsTitle: 'practicalTakeaway',
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
      name: 'question',
      type: 'relationship',
      index: true,
      relationTo: 'blessings-network-questions' as CollectionSlug,
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
      name: 'answer',
      type: 'textarea',
      required: true,
    },
    {
      name: 'practicalTakeaway',
      type: 'textarea',
      admin: {
        description: 'Short public summary of the most useful lesson in this reply.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      admin: {
        description: 'Lower numbers appear first under a question.',
        position: 'sidebar',
      },
      defaultValue: 100,
      min: 0,
    },
    {
      name: 'submittedByEmail',
      type: 'email',
      admin: {
        description: 'Private verification email from the reply form.',
        position: 'sidebar',
      },
    },
    {
      name: 'submissionKey',
      type: 'text',
      admin: {
        description: 'Stable key used to make public answer submission retries idempotent.',
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
