import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  BLESSINGS_NETWORK_TENANT_ID,
  blessingsNetworkPublicStatuses,
  blessingsNetworkQuestionStatuses,
} from '@/features/blessings-network/types'

import { adminOrPublishedNetworkQuestion } from './access'

export const BlessingsNetworkQuestions: CollectionConfig = {
  slug: 'blessings-network-questions',
  labels: {
    plural: 'Advice questions',
    singular: 'Advice question',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedNetworkQuestion,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'category', 'questionStatus', 'publicStatus', 'displayOrder'],
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
      name: 'publicStatus',
      type: 'select',
      defaultValue: 'published',
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
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
      defaultValue: 'Starting out',
      required: true,
    },
    {
      name: 'questionStatus',
      type: 'select',
      defaultValue: 'seeking_advice',
      index: true,
      options: blessingsNetworkQuestionStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'askedByName',
      type: 'text',
      admin: {
        description: 'Public asker name shown in the admin for context.',
        position: 'sidebar',
      },
      defaultValue: 'Orianna Paxton',
      required: true,
    },
    {
      name: 'displayOrder',
      type: 'number',
      admin: {
        description: 'Lower numbers appear first on the page.',
        position: 'sidebar',
      },
      defaultValue: 100,
      min: 0,
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      admin: {
        description: 'Private note for edits, sourcing, or follow-up.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
