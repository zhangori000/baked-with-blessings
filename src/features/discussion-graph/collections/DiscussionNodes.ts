import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { buildSearchText, normalizeTags } from '@/features/discussion-graph/content'
import { authorStates, DISCUSSION_TENANT_ID, moderationStatuses, nodeTypes } from '../types'
import { adminOrVisible } from './access'

export const DiscussionNodes: CollectionConfig = {
  slug: 'discussion-nodes',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrVisible,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'type', 'isRoot', 'moderationStatus', 'lastActivityAt'],
    group: 'Discussion Graph',
    useAsTitle: 'title',
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
      name: 'isRoot',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'rootNode',
      type: 'relationship',
      admin: {
        description: 'Blank for root topics. Child nodes point to the root topic for fast queries.',
      },
      index: true,
      relationTo: 'discussion-nodes',
    },
    {
      name: 'author',
      type: 'relationship',
      admin: {
        description: 'Blank for anonymous testing posts.',
      },
      relationTo: ['admins', 'customers'],
    },
    {
      name: 'authorDisplayName',
      type: 'text',
      admin: {
        description: 'Display name stored on the node. Anonymous test posts can still show a name.',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'question',
      options: nodeTypes.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'json',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
      hooks: {
        beforeValidate: [
          ({ value }) =>
            normalizeTags(
              Array.isArray(value)
                ? value.map((entry) =>
                    typeof entry?.tag === 'string' ? entry.tag : String(entry || ''),
                  )
                : [],
            ).map((tag) => ({ tag })),
        ],
      },
    },
    {
      name: 'searchText',
      type: 'textarea',
      admin: {
        description: 'Derived from title, content blocks, and tags for simple search.',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ siblingData }) =>
            buildSearchText({
              content: siblingData.content,
              tags: Array.isArray(siblingData.tags)
                ? siblingData.tags.map((entry) =>
                    typeof entry?.tag === 'string' ? entry.tag : String(entry || ''),
                  )
                : [],
              title: typeof siblingData.title === 'string' ? siblingData.title : '',
            }),
        ],
      },
    },
    {
      name: 'moderationStatus',
      type: 'select',
      defaultValue: 'visible',
      index: true,
      options: moderationStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'moderationReason',
      type: 'textarea',
    },
    {
      name: 'moderatedBy',
      type: 'relationship',
      relationTo: 'admins',
    },
    {
      name: 'moderatedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'authorState',
      type: 'select',
      defaultValue: 'current',
      options: authorStates.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'reconsideredDueToNode',
      type: 'relationship',
      relationTo: 'discussion-nodes',
    },
    {
      name: 'supportCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'challengeCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'responseCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'questionCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'awarenessCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'cryCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'wiltedRoseCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'childCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
