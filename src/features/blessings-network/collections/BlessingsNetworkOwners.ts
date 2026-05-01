import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  BLESSINGS_NETWORK_TENANT_ID,
  blessingsNetworkPublicStatuses,
} from '@/features/blessings-network/types'

import { adminOrPublishedNetworkOwner } from './access'

export const BlessingsNetworkOwners: CollectionConfig = {
  slug: 'blessings-network-owners',
  labels: {
    plural: 'Advice owners',
    singular: 'Advice owner',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedNetworkOwner,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['businessName', 'ownerName', 'title', 'location', 'publicStatus'],
    group: 'Community Advice',
    useAsTitle: 'businessName',
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
      defaultValue: 'under_review',
      index: true,
      options: blessingsNetworkPublicStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'ownerName',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'businessName',
      type: 'text',
      required: true,
    },
    {
      name: 'businessType',
      type: 'text',
      admin: {
        description: 'Short public label, for example cafe, bakery, catering, coffee, or retail.',
      },
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'websiteUrl',
      type: 'text',
      admin: {
        description: 'Public website link.',
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      admin: {
        description: 'Public LinkedIn profile or company link.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief public description of what the business sells or serves.',
      },
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Longer public owner/business bio shown in the Learn more modal.',
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: {
        description: 'Private. Used only if the site owner needs to verify the submission.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      admin: {
        description: 'Lower numbers appear first in the owner showcase.',
        position: 'sidebar',
      },
      defaultValue: 100,
      min: 0,
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
