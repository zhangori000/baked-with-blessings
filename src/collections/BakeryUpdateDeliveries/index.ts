import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * One row per customer per channel for a bakery update. The unique index on
 * (update, customer, channel) is what keeps a retry from texting or emailing
 * the same person twice.
 */
export const BakeryUpdateDeliveries: CollectionConfig = {
  slug: 'bakery-update-deliveries',
  access: {
    create: () => false,
    delete: () => false,
    read: adminOnly,
    update: () => false,
  },
  admin: {
    defaultColumns: ['bakeryUpdate', 'customer', 'channel', 'status', 'updatedAt'],
    description: 'Who each bakery update went to. Hidden from daily work.',
    group: 'Users',
    hidden: true,
    useAsTitle: 'address',
  },
  fields: [
    {
      name: 'bakeryUpdate',
      type: 'relationship',
      index: true,
      relationTo: 'bakery-updates',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      index: true,
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'channel',
      type: 'select',
      options: [
        { label: 'Text', value: 'sms' },
        { label: 'Email', value: 'email' },
      ],
      required: true,
    },
    {
      name: 'address',
      type: 'text',
      admin: {
        description: 'The phone number or email address this was sent to.',
      },
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'queued',
      index: true,
      options: [
        { label: 'Waiting', value: 'queued' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Skipped', value: 'skipped' },
      ],
      required: true,
    },
    {
      name: 'providerMessageId',
      type: 'text',
      admin: {
        description: 'The Twilio or Resend id, for looking a message up in their logs.',
      },
    },
    {
      name: 'error',
      type: 'text',
    },
  ],
  indexes: [
    {
      fields: ['bakeryUpdate', 'customer', 'channel'],
      unique: true,
    },
  ],
  timestamps: true,
}
