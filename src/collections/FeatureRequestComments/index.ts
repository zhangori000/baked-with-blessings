import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser, isCustomerUser } from '@/access/utilities'

export const FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH = 500
export const FEATURE_REQUEST_COMMENT_PSEUDONYM_MAX_LENGTH = 60

export const FeatureRequestComments: CollectionConfig = {
  slug: 'feature-request-comments',
  labels: {
    plural: 'Feature Request Comments',
    singular: 'Feature Request Comment',
  },
  access: {
    create: ({ req: { user } }) => isCustomerUser(user) || isAdminUser(user),
    delete: adminOnly,
    read: () => true,
    update: ({ req: { user } }) => isAdminUser(user) || isCustomerUser(user),
  },
  admin: {
    defaultColumns: ['request', 'body', 'isHidden', 'createdAt'],
    description:
      'Replies to feature requests. Owner moderation: tick "isHidden" to take a comment off the public thread without deleting it.',
    group: 'Community',
    useAsTitle: 'body',
  },
  fields: [
    {
      name: 'request',
      type: 'relationship',
      admin: {
        description: 'The feature request this comment replies to.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'feature-requests',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        description: 'The logged-in customer who posted this comment.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: `The reply body (${FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH} chars max).`,
      },
      maxLength: FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH,
      required: true,
    },
    {
      name: 'displayMode',
      type: 'select',
      admin: {
        description:
          '"Self" shows the customer\'s real account name. "Anonymous" shows a pseudonym (or "Anonymous").',
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
        condition: (_data, siblingData) => siblingData?.displayMode === 'anonymous',
        description: 'Pseudonym shown when displayMode = "anonymous". Blank → "Anonymous".',
      },
      maxLength: FEATURE_REQUEST_COMMENT_PSEUDONYM_MAX_LENGTH,
    },
    {
      name: 'isHidden',
      type: 'checkbox',
      admin: {
        description: 'Hide from the public thread (admin moderation). Does not delete.',
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
  ],
  timestamps: true,
}
