import type { Payload, PayloadRequest } from 'payload'

import { buildSearchText } from '@/features/discussion-graph/content'
import {
  DISCUSSION_TENANT_ID,
  type DiscussionContent,
} from '@/features/discussion-graph/types'
import { REVIEW_TENANT_ID } from '@/features/reviews/types'
import { seed } from './index'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  find: (args: unknown) => Promise<{ docs: Array<Record<string, unknown>> }>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

const productionReview = {
  body: 'The cookie tray looked beautiful, tasted fresh, and made the table feel cared for without needing extra decoration.',
  businessResponse:
    'Thank you. That is exactly the kind of order we want to make: simple to serve, fresh, and thoughtful.',
  customerName: 'Example customer',
  publicStatus: 'published' as const,
  rating: 5,
  reviewTone: 'loved_it' as const,
  responseStatus: 'closed' as const,
  tenantId: REVIEW_TENANT_ID,
  title: 'The tray made the table feel special',
  visitContext: 'Example catering pickup',
}

const productionDiscussionTopics: Array<{
  content: DiscussionContent
  submissionKey: string
  tags: string[]
  title: string
}> = [
  {
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'What is there to do in Minnesota, especially if someone is visiting for the first time?',
          type: 'question',
        },
        {
          id: 'background_1',
          text: 'I am curious about the places people actually recommend: neighborhoods, parks, winter activities, museums, lakes, small shops, food spots, events, and anything that feels especially Minnesota.',
          type: 'background',
        },
      ],
    },
    submissionKey: 'seed:production:discussion:minnesota-things-to-do',
    tags: ['minnesota', 'twin-cities', 'visitors', 'things-to-do'],
    title: 'What is there to do in Minnesota?',
  },
  {
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'What are your favorite dessert, bakery, or cafe places in the Twin Cities, and why?',
          type: 'question',
        },
        {
          id: 'background_1',
          text: 'The goal is to collect specific recommendations: what to order, what the place does well, what kind of mood it fits, and what other small food businesses can learn from it.',
          type: 'background',
        },
      ],
    },
    submissionKey: 'seed:production:discussion:twin-cities-bakery-cafes',
    tags: ['twin-cities', 'bakery', 'cafe', 'dessert', 'recommendations'],
    title: 'What are your favorite dessert, bakery, or cafe places in the Twin Cities, and why?',
  },
]

const upsertProductionReview = async (payload: Payload) => {
  const loosePayload = payload as LoosePayload
  const existing = await loosePayload.find({
    collection: 'reviews',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: REVIEW_TENANT_ID } },
        { title: { equals: productionReview.title } },
      ],
    },
  })

  if (existing.docs[0]?.id) {
    await loosePayload.update({
      collection: 'reviews',
      data: productionReview,
      id: existing.docs[0].id,
      overrideAccess: true,
    })
    return
  }

  await loosePayload.create({
    collection: 'reviews',
    data: productionReview,
    overrideAccess: true,
  })
}

const upsertProductionDiscussionTopics = async (payload: Payload) => {
  const loosePayload = payload as LoosePayload
  const admins = await loosePayload.find({
    collection: 'admins',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
  })
  const admin = admins.docs[0]
  const now = new Date().toISOString()

  for (const topic of productionDiscussionTopics) {
    const existing = await loosePayload.find({
      collection: 'discussion-nodes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        submissionKey: {
          equals: topic.submissionKey,
        },
      },
    })

    const data = {
      author: admin?.id
        ? {
            relationTo: 'admins',
            value: admin.id,
          }
        : undefined,
      authorDisplayName: typeof admin?.name === 'string' ? admin.name : 'Site Admin',
      content: topic.content,
      isRoot: true,
      lastActivityAt: now,
      moderationStatus: 'visible',
      searchText: buildSearchText({
        content: topic.content,
        tags: topic.tags,
        title: topic.title,
      }),
      submissionKey: topic.submissionKey,
      tags: topic.tags.map((tag) => ({ tag })),
      tenantId: DISCUSSION_TENANT_ID,
      title: topic.title,
      type: 'question',
    }

    if (existing.docs[0]?.id) {
      await loosePayload.update({
        collection: 'discussion-nodes',
        data,
        id: existing.docs[0].id,
        overrideAccess: true,
      })
      continue
    }

    await loosePayload.create({
      collection: 'discussion-nodes',
      data,
      overrideAccess: true,
    })
  }
}

export const seedProduction = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  await seed({ payload, req })
  await upsertProductionReview(payload)
  await upsertProductionDiscussionTopics(payload)
}
