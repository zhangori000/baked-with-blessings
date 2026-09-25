import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * One row per update the owner sent from Bulk tools. Rows are written only by
 * the send route (overrideAccess), so history cannot be edited from the admin.
 */
export const BakeryUpdates: CollectionConfig = {
  slug: 'bakery-updates',
  access: {
    create: () => false,
    delete: () => false,
    read: adminOnly,
    update: () => false,
  },
  admin: {
    defaultColumns: ['subject', 'status', 'createdAt'],
    description: 'Updates sent to customers by text and email. Send new ones from Bulk tools.',
    group: 'Users',
    hidden: true,
    useAsTitle: 'subject',
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'template',
      type: 'select',
      defaultValue: 'note',
      options: [
        { label: 'Just a note', value: 'note' },
        { label: 'New flavor', value: 'flavor' },
        { label: 'Market date', value: 'market' },
      ],
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      admin: {
        description: 'The cookie a "New flavor" update shows.',
      },
      relationTo: 'products',
    },
    {
      name: 'market',
      type: 'group',
      admin: {
        description: 'Where and when, for a "Market date" update.',
      },
      fields: [
        { name: 'place', type: 'text' },
        { name: 'date', type: 'text', admin: { description: 'YYYY-MM-DD' } },
        { name: 'hours', type: 'text' },
        { name: 'address', type: 'text' },
      ],
    },
    {
      name: 'sendText',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sendEmail',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'preparing',
      index: true,
      options: [
        { label: 'Preparing', value: 'preparing' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
      ],
      required: true,
    },
    {
      name: 'requestKey',
      type: 'text',
      admin: {
        description: 'Stops a double click or a retry from sending the same update twice.',
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'admins',
    },
    {
      name: 'finishedAt',
      type: 'date',
    },
  ],
  timestamps: true,
}
