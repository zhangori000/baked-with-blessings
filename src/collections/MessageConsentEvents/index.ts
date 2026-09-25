import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const MessageConsentEvents: CollectionConfig = {
  slug: 'message-consent-events',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['customer', 'channel', 'ok', 'source', 'createdAt'],
    description: 'History of bakery text and email opt-in changes. Hidden from daily work.',
    group: 'Security',
    hidden: true,
    useAsTitle: 'source',
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
    },
    {
      name: 'channel',
      type: 'select',
      options: [
        { label: 'Text', value: 'sms' },
        { label: 'Email', value: 'email' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'ok',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      admin: {
        description: 'Where this yes or no came from, such as signup, a text reply, or the account page.',
      },
    },
    {
      name: 'rawBody',
      type: 'text',
      admin: {
        description: 'The exact text we received, when this change came from an inbound SMS.',
      },
    },
  ],
  timestamps: true,
}
