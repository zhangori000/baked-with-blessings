import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser, isCustomerUser } from '@/access/utilities'

export const FEATURE_REQUEST_TITLE_MAX_LENGTH = 60
export const FEATURE_REQUEST_BODY_MAX_LENGTH = 1000
export const FEATURE_REQUEST_PSEUDONYM_MAX_LENGTH = 60

export const FeatureRequests: CollectionConfig = {
  slug: 'feature-requests',
  labels: {
    plural: 'Feature Requests',
    singular: 'Feature Request',
  },
  access: {
    create: ({ req: { user } }) => isCustomerUser(user) || isAdminUser(user),
    delete: adminOnly,
    read: () => true,
    update: ({ req: { user } }) => isAdminUser(user) || isCustomerUser(user),
  },
  admin: {
    defaultColumns: ['title', 'visibility', 'isHidden', 'ratingCount', 'createdAt'],
    description:
      'Customer-submitted feature requests. Public requests appear on /feature-requests; private ones are direct messages only the bakery owner sees in this admin. Filter by visibility = "private" for your private inbox.',
    group: 'Community',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        description: 'The logged-in customer who submitted this request.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        description:
          'Public: shows on /feature-requests for everyone to rate and comment on. Private: direct message to the bakery owner only.',
        position: 'sidebar',
      },
      defaultValue: 'public',
      index: true,
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private (DM)', value: 'private' },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: `Short headline for the request (${FEATURE_REQUEST_TITLE_MAX_LENGTH} chars max).`,
      },
      maxLength: FEATURE_REQUEST_TITLE_MAX_LENGTH,
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: `The request itself (${FEATURE_REQUEST_BODY_MAX_LENGTH} chars max).`,
      },
      maxLength: FEATURE_REQUEST_BODY_MAX_LENGTH,
      required: true,
    },
    {
      name: 'displayMode',
      type: 'select',
      admin: {
        condition: (_data, siblingData) => siblingData?.visibility === 'public',
        description:
          'Only applies to public requests. "Self" shows the customer\'s real account name. "Anonymous" shows a pseudonym (or "Anonymous").',
      },
      defaultValue: 'self',
      options: [
        { label: 'Show real name', value: 'self' },
        { label: 'Anonymous / pseudonym', value: 'anonymous' },
      ],
    },
    {
      name: 'pseudonym',
      type: 'text',
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.visibility === 'public' && siblingData?.displayMode === 'anonymous',
        description: 'Pseudonym shown when displayMode = "anonymous". Blank → "Anonymous".',
      },
      maxLength: FEATURE_REQUEST_PSEUDONYM_MAX_LENGTH,
    },
    {
      name: 'isHidden',
      type: 'checkbox',
      admin: {
        description: 'Hide from the public list (admin moderation). Does not delete.',
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
    {
      name: 'ratingCount',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'ratingSum',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'ratings',
      type: 'array',
      admin: {
        description:
          'Per-customer 1–5 star rating. Maintained by the rating endpoint. ratingCount and ratingSum are derived.',
        readOnly: true,
      },
      fields: [
        {
          name: 'customer',
          type: 'relationship',
          relationTo: 'customers',
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          max: 5,
          min: 1,
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}
