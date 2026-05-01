import type { Payload } from 'payload'

import { buildSearchText, getShortPreview } from '@/features/discussion-graph/content'
import {
  DISCUSSION_TENANT_ID,
  type DiscussionBoardEdge,
  type DiscussionBoardNode,
  type DiscussionContent,
  type DiscussionEdgeType,
  type DiscussionTreeData,
} from '@/features/discussion-graph/types'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  delete: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return ''
}

const getRelationshipId = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)

  if (typeof value === 'object' && 'value' in value) {
    return getRelationshipId(value.value)
  }

  return toStringId(value)
}

const toPayloadId = (value: string) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && String(numeric) === value ? numeric : value
}

const getAuthorName = (author: unknown, displayName: unknown): string => {
  if (typeof displayName === 'string' && displayName.trim()) return displayName.trim()

  if (!author || typeof author !== 'object') return 'Community member'

  if ('value' in author) {
    const value = author.value
    if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
      return value.name
    }
  }

  if ('name' in author && typeof author.name === 'string') return author.name

  return 'Community member'
}

const getTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return []

  return tags
    .map((entry) => {
      if (entry && typeof entry === 'object' && 'tag' in entry && typeof entry.tag === 'string') {
        return entry.tag
      }
      return ''
    })
    .filter(Boolean)
}

export const serializeDiscussionNode = (doc: Record<string, unknown>): DiscussionBoardNode => ({
  authorName: getAuthorName(doc.author, doc.authorDisplayName),
  authorState: doc.authorState === 'reconsidered' ? 'reconsidered' : 'current',
  awarenessCount: typeof doc.awarenessCount === 'number' ? doc.awarenessCount : 0,
  challengeCount: typeof doc.challengeCount === 'number' ? doc.challengeCount : 0,
  childCount: typeof doc.childCount === 'number' ? doc.childCount : 0,
  content:
    doc.content && typeof doc.content === 'object' && 'blocks' in doc.content
      ? (doc.content as DiscussionContent)
      : { blocks: [] },
  createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
  cryCount: typeof doc.cryCount === 'number' ? doc.cryCount : 0,
  id: toStringId(doc.id),
  isRoot: Boolean(doc.isRoot),
  lastActivityAt:
    typeof doc.lastActivityAt === 'string'
      ? doc.lastActivityAt
      : typeof doc.updatedAt === 'string'
        ? doc.updatedAt
        : new Date().toISOString(),
  moderationStatus: doc.moderationStatus === 'hidden' ? 'hidden' : 'visible',
  questionCount: typeof doc.questionCount === 'number' ? doc.questionCount : 0,
  responseCount: typeof doc.responseCount === 'number' ? doc.responseCount : 0,
  searchText: typeof doc.searchText === 'string' ? doc.searchText : '',
  shortPreview: getShortPreview(doc.content),
  supportCount: typeof doc.supportCount === 'number' ? doc.supportCount : 0,
  tags: getTags(doc.tags),
  title: typeof doc.title === 'string' ? doc.title : 'Untitled discussion',
  type: doc.type === 'statement' ? 'statement' : 'question',
  updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
  wiltedRoseCount: typeof doc.wiltedRoseCount === 'number' ? doc.wiltedRoseCount : 0,
})

export const serializeDiscussionEdge = (doc: Record<string, unknown>): DiscussionBoardEdge => ({
  fromNodeId: getRelationshipId(doc.fromNode),
  id: toStringId(doc.id),
  toBlockIds: Array.isArray(doc.toBlockIds)
    ? doc.toBlockIds
        .map((entry) => {
          if (
            entry &&
            typeof entry === 'object' &&
            'blockId' in entry &&
            typeof entry.blockId === 'string'
          ) {
            return entry.blockId
          }
          return ''
        })
        .filter(Boolean)
    : [],
  toNodeId: getRelationshipId(doc.toNode),
  type: (typeof doc.type === 'string' ? doc.type : 'responds_to') as DiscussionEdgeType,
})

type StarterTopic = {
  content: DiscussionContent
  sourceLabel: string
  sourceUrl: string
  tags: string[]
  title: string
}

const starterTopics: StarterTopic[] = [
  {
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'How is I-94E still clogged? By the time GTA6 releases, it will still be clogged.',
          type: 'question',
        },
        {
          id: 'background_1',
          text: 'The distance from Plymouth to University of Minnesota is not the Silk Road. How do we go from 4 lanes to 1 lane, and every single person in the world is trying to go to I-94E?\n\nThe thing is, no one grows up in life, going to elementary school, then middle school, and then, when it is time to choose what they want to do in life, says, "Hey Mom, I want to fix I-94E! That is my life missions!"\n\nBut the thing is genuinely who is in charge of this. If there is someone who has the power to fix this, who are they? What was their GPA? What was their life story?',
          type: 'background',
        },
      ],
    },
    sourceLabel: 'MnDOT congestion dashboard and Rethinking I-94',
    sourceUrl: 'https://www.mndot.org/measures/congestion.html',
    tags: ['i-94', 'traffic', 'umn', 'minneapolis', 'transportation'],
    title: 'How is I-94E still clogged? By the time GTA6 releases, it will still be clogged.',
  },
  {
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'If you wanted to start a cafe or bakery in Minnesota, how would you buy property?',
          type: 'question',
        },
      ],
    },
    sourceLabel: 'Minnesota DEED and City of Minneapolis small business guidance',
    sourceUrl: 'https://mn.gov/deed/business/starting-business/index.jsp',
    tags: ['bakery', 'cafe', 'property', 'minnesota', 'small-business'],
    title: 'If you wanted to start a cafe or bakery in Minnesota, how would you buy property?',
  },
  {
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'If a friend visited Minnesota for the first time, where should you take them?',
          type: 'question',
        },
      ],
    },
    sourceLabel: 'Meet Minneapolis and Explore Minnesota visitor guides',
    sourceUrl: 'https://www.minneapolis.org/things-to-do/first-time-essentials/',
    tags: ['minnesota', 'visitors', 'minneapolis', 'saint-paul', 'things-to-do'],
    title: 'If a friend visited Minnesota for the first time, where should you take them?',
  },
]

const removedStarterTopicTitles = [
  'Which companies are able to buy land and build apartment buildings near Stadium Village at UMN?',
  'Who gets to replace Dinkytown commercial strips with apartments, and how does the money work?',
]

type ExampleReply = {
  authorDisplayName: string
  content: DiscussionContent
  edgeType: DiscussionEdgeType
  parentTitle?: string
  tags: string[]
  title: string
  type: 'question' | 'statement'
}

const i94ExampleReplies: ExampleReply[] = [
  {
    authorDisplayName: 'Orianna Paxton',
    content: {
      blocks: [
        {
          id: 'body_1',
          text: 'I was reading this link: https://experience.arcgis.com/experience/19b7f2c1d493403a802589a0844157d1/\n\nAnd it says:\n\nProjects within the Rethinking I-94 program will accomplish the following:\nImprove mobility for people and goods on, along and across the corridor in a way that facilitates community connections for all modes\nEnhance safety for people and goods on, along and across the I-94 corridor for all modes\nAddress aging infrastructure condition within the I-94 corridor\nSupport transportation objectives consistent with adopted state and regional (Met Council) plans\n\nI do not see a single reference to reducing congestion. Like who cares about aging infrastructure conditions, when we still have 1 lane? Who cares about "facilitating community and connections," what even is that BS?',
          type: 'body',
        },
      ],
    },
    edgeType: 'responds_to',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'arcgis'],
    title: 'I was reading the Rethinking I-94 page',
    type: 'statement',
  },
  {
    authorDisplayName: 'Sam in Dinkytown',
    content: {
      blocks: [
        {
          id: 'body_1',
          text: 'A key clarification here: the part a lot of us are mad about might be the I-394 eastbound to I-94 eastbound connection downtown, not the whole Rethinking I-94 corridor.\n\nThat spot is usually referred to as the I-394/I-94 interchange, or more specifically the EB I-394 to EB I-94 movement. It acts like a weaving problem: some cars are trying to merge onto I-94, other cars are trying to get over for exits or other lanes, and everyone is doing it in a tiny amount of space. So yeah, people behave badly there, but the geometry is doing a lot of the damage too.\n\nRethinking I-94 is bigger than that. It is mainly about the Minneapolis-to-St. Paul corridor and long-term options like maintenance, reduced freeway, reconfigured freeway, at-grade concepts, and transit options. That is related, but it is not the exact same thing as the daily I-394 to I-94 choke point.\n\nSo there are two problems getting mixed together:\n- I-394/I-94 interchange: localized downtown congestion, merging, weaving, and a tunnel bottleneck.\n- Rethinking I-94: long-term corridor redesign, environmental review, transportation tradeoffs, and community impacts.\n\nCBS Minnesota has a Good Question segment on this exact interchange. They say drivers ask whether they should zipper merge there, and the answer from safety officials is basically: no, this is different. A zipper merge is when two lanes cleanly become one. This interchange is messier because traffic is not simply merging; people are entering, exiting, and cutting across movements at the same time.\n\nCBS link: https://www.cbsnews.com/minnesota/news/394-94-interchange-minneapolis-merging-good-question/\nMnDOT zipper merge page: https://www.mndot.org/zippermerge/\nRethinking I-94 page: https://talk.dot.state.mn.us/rethinking-i94\n\nMain takeaway: if the question is "why is this specific ramp/interchange always awful?", the answer might not be hidden in the Rethinking I-94 chart. It might be a very specific interchange design and traffic-flow problem: short merge distance, competing movements, and too much volume.',
          type: 'body',
        },
      ],
    },
    edgeType: 'responds_to',
    parentTitle: 'I was reading the Rethinking I-94 page',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'interchange'],
    title: 'This might be the wrong I-94 problem',
    type: 'statement',
  },
  {
    authorDisplayName: 'Maya from UMN',
    content: {
      blocks: [
        {
          id: 'question_1',
          text: 'I do not understand the graphs in that link, can someone help me?',
          type: 'question',
        },
        {
          id: 'background_1',
          text: 'In that article, they say we have a "See the results" section, served by this link: https://experience.arcgis.com/experience/19b7f2c1d493403a802589a0844157d1/page/Evaluation-Summary',
          type: 'background',
        },
      ],
    },
    edgeType: 'asks_about',
    parentTitle: 'I was reading the Rethinking I-94 page',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'evaluation'],
    title: 'Can someone explain the results graph?',
    type: 'question',
  },
  {
    authorDisplayName: 'Derrick on Huron',
    content: {
      blocks: [
        {
          id: 'body_1',
          text: 'Before even arguing about the colors, define "alternative."\n\nOn this chart, an alternative is basically a possible design future for I-94. It is not one tiny ramp fix. It is a whole concept for what the corridor could become.\n\nNo Build means do not build a big new project. It is the baseline, basically "what if we do not change the corridor in a major way?"\n\nMaintenance A / Maintenance B means keep I-94 as a freeway and do repair-type work. The money there is not "fix one pothole." It is corridor maintenance: pavement, bridges, walls, drainage, ramps, safety repairs, and keeping the existing freeway alive. Maintenance A gets dismissed in the screenshot because it does not meet purpose and need. Maintenance B gets retained even though it still has concerns.\n\nAt-Grade means the freeway would stop acting like a sunken/raised highway in that area and become more like a surface-level roadway. That is a massive urban design change, not just repainting lanes.\n\nLocal/Regional Roadways means shifting more of the corridor into a connected street network instead of one big freeway tube. Again, huge change.\n\nReduced Freeway means I-94 is still a freeway, but smaller. Fewer lanes or less freeway footprint, usually paired with transit or other changes.\n\nReconfigured Freeway means still a freeway, but redesigned. Different layout, ramps, lanes, or geometry.\n\nExpanded Freeway means bigger freeway. More capacity or footprint.\n\nSo when the row says "Reduced Freeway A: Bus Rapid Transit with zero stops," I read that as: keep a smaller freeway concept and include a BRT line in the corridor, but with zero stations inside this evaluated stretch. Which is immediately confusing because, okay, bus rapid transit for who, then? Passing through? Connecting elsewhere? That needs plain English.',
          type: 'body',
        },
      ],
    },
    edgeType: 'responds_to',
    parentTitle: 'Can someone explain the results graph?',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'alternatives'],
    title: 'What do these alternatives even mean?',
    type: 'statement',
  },
  {
    authorDisplayName: 'Derrick on Huron',
    content: {
      blocks: [
        {
          id: 'body_1',
          text: 'I will tackle the x and y axes first.\n\nThe y-axis is the list of alternatives. Each row is one possible future for I-94: No Build, Maintenance A/B, At-Grade, Local/Regional Roadways, Reduced Freeway, Reconfigured Freeway, Expanded Freeway, and so on.\n\nThe x-axis is not one single score. It is a bunch of categories MnDOT is using to judge every alternative: project needs, social/economic/environmental impacts, community goals, costs, consistency with plans, and then whether the option should be retained or dismissed.\n\nSo the chart is basically: each row is one possible version of I-94, and each column is one test they are grading it on. Green check means better. Yellow dot means mixed or maybe. Red dash means bad or does not meet the thing.\n\nThe annoying part is that the chart tells you whether Maintenance A is good or bad across categories, but it does not instantly tell a normal person what Maintenance A physically means on the ground. That is the missing translation.',
          type: 'body',
        },
      ],
    },
    edgeType: 'responds_to',
    parentTitle: 'Can someone explain the results graph?',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'evaluation'],
    title: 'The rows are options and the columns are grading categories',
    type: 'statement',
  },
  {
    authorDisplayName: 'Sam in Dinkytown',
    content: {
      blocks: [
        {
          id: 'body_1',
          text: 'Look at the construction and maintenance cost columns on the right.\n\nFor Maintenance A, the screenshot shows construction around $506M to $675M and maintenance around $80M to $107M. That means this row is not "new shiny megaproject." It is more like: keep the existing freeway concept and spend a massive amount repairing/replacing the stuff that keeps it functioning.\n\nFor Maintenance B, the screenshot shows construction around $1.7B to $2.2B and maintenance around $100M to $135M. That is the one that should make people stop scrolling. $1.7B means 1,700 million dollars. That is insane money to normal people.\n\nConstruction cost is the big upfront money to build the alternative: roadways, ramps, bridges, walls, drainage, utilities, transit pieces, all the physical work. Maintenance cost is the longer-term cost to keep the thing alive after it exists.\n\nThe part I still want spelled out is: what exactly are we buying with that? Are we buying less congestion into UMN? safer crossings? fewer busted bridges? better buses? neighborhood reconnection? all of it? Because if the answer is "we spent $1.7B and I still sit there staring at brake lights," people are going to lose their minds.',
          type: 'body',
        },
      ],
    },
    edgeType: 'responds_to',
    parentTitle: 'Can someone explain the results graph?',
    tags: ['seed-example', 'seed-i94-gta6-v8', 'i-94', 'costs'],
    title: 'The billion-dollar columns need a human translation',
    type: 'statement',
  },
]

export const ensureStarterDiscussionTopics = async (payload: Payload) => {
  const existing = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ tenantId: { equals: DISCUSSION_TENANT_ID } }, { isRoot: { equals: true } }],
    },
  })

  if (existing.docs.length > 0) return

  const admin = await payload.find({
    collection: 'admins',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
  })

  const firstAdmin = admin.docs[0]
  if (!firstAdmin) return

  const now = new Date().toISOString()

  for (const topic of starterTopics) {
    await (payload as LoosePayload).create({
      collection: 'discussion-nodes',
      data: {
        author: {
          relationTo: 'admins',
          value: firstAdmin.id,
        },
        authorDisplayName: typeof firstAdmin.name === 'string' ? firstAdmin.name : 'Site Admin',
        content: topic.content,
        isRoot: true,
        lastActivityAt: now,
        moderationStatus: 'visible',
        tags: topic.tags.map((tag) => ({ tag })),
        tenantId: DISCUSSION_TENANT_ID,
        title: topic.title,
        type: 'question',
      },
      overrideAccess: true,
    })
  }
}

const syncStarterDiscussionTopics = async (payload: Payload) => {
  for (const topic of starterTopics) {
    const existing = await payload.find({
      collection: 'discussion-nodes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: DISCUSSION_TENANT_ID } },
          { isRoot: { equals: true } },
          {
            or: [
              { title: { equals: topic.title } },
              ...(topic.tags.includes('stadium-village')
                ? [
                    {
                      title: {
                        equals:
                          'Who gets to replace Dinkytown commercial strips with apartments, and how does the money work?',
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      },
    })

    const node = existing.docs[0] as unknown as Record<string, unknown> | undefined
    if (!node) continue

    await (payload as LoosePayload).update({
      collection: 'discussion-nodes',
      data: {
        content: topic.content,
        searchText: buildSearchText({
          content: topic.content,
          tags: topic.tags,
          title: topic.title,
        }),
        tags: topic.tags.map((tag) => ({ tag })),
        title: topic.title,
      },
      id: String(node.id),
      overrideAccess: true,
    })
  }
}

const deleteRemovedStarterTopics = async (payload: Payload) => {
  const removedResult = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        {
          or: removedStarterTopicTitles.map((title) => ({
            title: {
              equals: title,
            },
          })),
        },
      ],
    },
  })

  if (!removedResult.docs.length) return

  const removedIds = new Set(
    removedResult.docs.map((doc) => String((doc as unknown as Record<string, unknown>).id)),
  )

  const edgeResult = await payload.find({
    collection: 'discussion-edges',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      tenantId: {
        equals: DISCUSSION_TENANT_ID,
      },
    },
  })

  for (const edge of edgeResult.docs as unknown as Array<Record<string, unknown>>) {
    if (
      removedIds.has(getRelationshipId(edge.fromNode)) ||
      removedIds.has(getRelationshipId(edge.toNode)) ||
      removedIds.has(getRelationshipId(edge.rootNode))
    ) {
      await (payload as LoosePayload).delete({
        collection: 'discussion-edges',
        id: String(edge.id),
        overrideAccess: true,
      })
    }
  }

  for (const node of removedResult.docs as unknown as Array<Record<string, unknown>>) {
    await (payload as LoosePayload).delete({
      collection: 'discussion-nodes',
      id: String(node.id),
      overrideAccess: true,
    })
  }
}

const updateParentCounts = async ({
  edgeType,
  parent,
  payload,
}: {
  edgeType: DiscussionEdgeType
  parent: Record<string, unknown>
  payload: Payload
}) => {
  const data: Record<string, number | string> = {
    childCount: (typeof parent.childCount === 'number' ? parent.childCount : 0) + 1,
    lastActivityAt: new Date().toISOString(),
    responseCount: (typeof parent.responseCount === 'number' ? parent.responseCount : 0) + 1,
  }

  if (edgeType === 'asks_about') {
    data.questionCount = (typeof parent.questionCount === 'number' ? parent.questionCount : 0) + 1
  }

  if (edgeType === 'supports') {
    data.supportCount = (typeof parent.supportCount === 'number' ? parent.supportCount : 0) + 1
  }

  if (edgeType === 'challenges') {
    data.challengeCount =
      (typeof parent.challengeCount === 'number' ? parent.challengeCount : 0) + 1
  }

  await (payload as LoosePayload).update({
    collection: 'discussion-nodes',
    data,
    id: String(parent.id),
    overrideAccess: true,
  })
}

const deleteOldI94SeedExamples = async (payload: Payload) => {
  const oldSeedResult = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        { authorDisplayName: { equals: 'Research seed' } },
      ],
    },
  })

  if (!oldSeedResult.docs.length) return

  const oldSeedIds = new Set(
    oldSeedResult.docs.map((doc) => String((doc as unknown as Record<string, unknown>).id)),
  )

  const oldEdgeResult = await payload.find({
    collection: 'discussion-edges',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      tenantId: {
        equals: DISCUSSION_TENANT_ID,
      },
    },
  })

  for (const edge of oldEdgeResult.docs as unknown as Array<Record<string, unknown>>) {
    if (
      oldSeedIds.has(getRelationshipId(edge.fromNode)) ||
      oldSeedIds.has(getRelationshipId(edge.toNode))
    ) {
      await (payload as LoosePayload).delete({
        collection: 'discussion-edges',
        id: String(edge.id),
        overrideAccess: true,
      })
    }
  }

  for (const node of oldSeedResult.docs as unknown as Array<Record<string, unknown>>) {
    await (payload as LoosePayload).delete({
      collection: 'discussion-nodes',
      id: String(node.id),
      overrideAccess: true,
    })
  }
}

const deleteSeededI94Children = async (payload: Payload, rootId: string) => {
  const childResult = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 300,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        { isRoot: { equals: false } },
        { rootNode: { equals: toPayloadId(rootId) } },
      ],
    },
  })

  const seedNodes = (childResult.docs as unknown as Array<Record<string, unknown>>).filter((doc) =>
    getTags(doc.tags).includes('seed-example'),
  )

  if (!seedNodes.length) return

  const seedIds = new Set(seedNodes.map((doc) => String(doc.id)))
  const edgeResult = await payload.find({
    collection: 'discussion-edges',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      tenantId: {
        equals: DISCUSSION_TENANT_ID,
      },
    },
  })

  for (const edge of edgeResult.docs as unknown as Array<Record<string, unknown>>) {
    if (
      seedIds.has(getRelationshipId(edge.fromNode)) ||
      seedIds.has(getRelationshipId(edge.toNode))
    ) {
      await (payload as LoosePayload).delete({
        collection: 'discussion-edges',
        id: String(edge.id),
        overrideAccess: true,
      })
    }
  }

  for (const node of seedNodes) {
    await (payload as LoosePayload).delete({
      collection: 'discussion-nodes',
      id: String(node.id),
      overrideAccess: true,
    })
  }
}

const recalculateCountsForRoot = async (payload: Payload, root: Record<string, unknown>) => {
  const rootId = String(root.id)
  const childResult = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        { isRoot: { equals: false } },
        { rootNode: { equals: toPayloadId(rootId) } },
      ],
    },
  })

  const nodes = [root, ...(childResult.docs as unknown as Array<Record<string, unknown>>)]
  const countsByNodeId = new Map(
    nodes.map((node) => [
      String(node.id),
      {
        challengeCount: 0,
        childCount: 0,
        questionCount: 0,
        responseCount: 0,
        supportCount: 0,
      },
    ]),
  )

  const edgeResult = await payload.find({
    collection: 'discussion-edges',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        { rootNode: { equals: toPayloadId(rootId) } },
      ],
    },
  })

  for (const edge of edgeResult.docs as unknown as Array<Record<string, unknown>>) {
    const parentCounts = countsByNodeId.get(getRelationshipId(edge.toNode))
    if (!parentCounts) continue

    parentCounts.childCount += 1
    parentCounts.responseCount += 1

    if (edge.type === 'asks_about') {
      parentCounts.questionCount += 1
    }

    if (edge.type === 'supports') {
      parentCounts.supportCount += 1
    }

    if (edge.type === 'challenges') {
      parentCounts.challengeCount += 1
    }
  }

  for (const [nodeId, counts] of countsByNodeId) {
    await (payload as LoosePayload).update({
      collection: 'discussion-nodes',
      data: counts,
      id: nodeId,
      overrideAccess: true,
    })
  }
}

export const ensureI94ExampleReplies = async (payload: Payload) => {
  await deleteOldI94SeedExamples(payload)

  const i94Topic = starterTopics.find((topic) => topic.tags.includes('i-94'))
  if (!i94Topic) return

  let rootResult = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ tenantId: { equals: DISCUSSION_TENANT_ID } }, { title: { equals: i94Topic.title } }],
    },
  })

  if (!rootResult.docs.length) {
    rootResult = await payload.find({
      collection: 'discussion-nodes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: DISCUSSION_TENANT_ID } },
          {
            title: {
              equals: 'Can I-94 near UMN be made less clogged without making the city worse?',
            },
          },
        ],
      },
    })
  }

  const root = rootResult.docs[0] as unknown as Record<string, unknown> | undefined
  if (!root) return
  const rootId = String(root.id)

  await (payload as LoosePayload).update({
    collection: 'discussion-nodes',
    data: {
      content: i94Topic.content,
      searchText: buildSearchText({
        content: i94Topic.content,
        tags: i94Topic.tags,
        title: i94Topic.title,
      }),
      tags: i94Topic.tags.map((tag) => ({ tag })),
      title: i94Topic.title,
    },
    id: String(root.id),
    overrideAccess: true,
  })

  const alreadySeeded = await payload.find({
    collection: 'discussion-nodes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { tenantId: { equals: DISCUSSION_TENANT_ID } },
        { title: { equals: 'This might be the wrong I-94 problem' } },
      ],
    },
  })

  if (alreadySeeded.docs.length > 0) {
    await recalculateCountsForRoot(payload, root)
    const firstExplainer = alreadySeeded.docs[0] as unknown as Record<string, unknown>
    await (payload as LoosePayload).update({
      collection: 'discussion-nodes',
      data: {
        lastActivityAt: new Date(Date.now() + 60_000).toISOString(),
      },
      id: String(firstExplainer.id),
      overrideAccess: true,
    })
    return
  }
  await deleteSeededI94Children(payload, rootId)
  await recalculateCountsForRoot(payload, root)

  const createdByTitle = new Map<string, Record<string, unknown>>()

  for (const [index, example] of i94ExampleReplies.entries()) {
    const parent = example.parentTitle ? createdByTitle.get(example.parentTitle) : root
    if (!parent) continue

    const parentId = String(parent.id)
    const tags = example.tags.map((tag) => ({ tag }))
    const activityAt = new Date(Date.now() - index * 1000).toISOString()
    const node = await (payload as LoosePayload).create({
      collection: 'discussion-nodes',
      data: {
        authorDisplayName: example.authorDisplayName,
        content: example.content,
        isRoot: false,
        lastActivityAt: activityAt,
        moderationStatus: 'visible',
        rootNode: toPayloadId(rootId),
        searchText: buildSearchText({
          content: example.content,
          tags: example.tags,
          title: example.title,
        }),
        tags,
        tenantId: DISCUSSION_TENANT_ID,
        title: example.title,
        type: example.type,
      },
      overrideAccess: true,
    })

    await (payload as LoosePayload).create({
      collection: 'discussion-edges',
      data: {
        fromNode: node.id,
        rootNode: toPayloadId(rootId),
        tenantId: DISCUSSION_TENANT_ID,
        toNode: toPayloadId(parentId),
        type: example.edgeType,
      },
      overrideAccess: true,
    })

    await updateParentCounts({
      edgeType: example.edgeType,
      parent,
      payload,
    })

    createdByTitle.set(example.title, node)
  }

  await recalculateCountsForRoot(payload, root)

  const firstExplainer = createdByTitle.get('What do these alternatives even mean?')
  if (firstExplainer) {
    await (payload as LoosePayload).update({
      collection: 'discussion-nodes',
      data: {
        lastActivityAt: new Date(Date.now() + 60_000).toISOString(),
      },
      id: String(firstExplainer.id),
      overrideAccess: true,
    })
  }
}

const shouldAutoSeedDemoDiscussion = () =>
  process.env.BWB_AUTO_SEED_DEMO_CONTENT === 'true' || process.env.VERCEL_ENV !== 'production'

export const getDiscussionTreeData = async (payload: Payload): Promise<DiscussionTreeData> => {
  if (shouldAutoSeedDemoDiscussion()) {
    await ensureStarterDiscussionTopics(payload)
    await deleteRemovedStarterTopics(payload)
    await syncStarterDiscussionTopics(payload)
    await ensureI94ExampleReplies(payload)
  }

  const [nodeResult, edgeResult] = await Promise.all([
    payload.find({
      collection: 'discussion-nodes',
      depth: 1,
      limit: 300,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: DISCUSSION_TENANT_ID } },
          { moderationStatus: { equals: 'visible' } },
        ],
      },
    }),
    payload.find({
      collection: 'discussion-edges',
      depth: 0,
      limit: 600,
      pagination: false,
      where: {
        tenantId: {
          equals: DISCUSSION_TENANT_ID,
        },
      },
    }),
  ])

  const serializedNodes = nodeResult.docs.map((doc) =>
    serializeDiscussionNode(doc as unknown as Record<string, unknown>),
  )
  const visibleNodeIds = new Set(serializedNodes.map((node) => node.id))
  const edges = edgeResult.docs
    .map((doc) => serializeDiscussionEdge(doc as unknown as Record<string, unknown>))
    .filter((edge) => visibleNodeIds.has(edge.fromNodeId) && visibleNodeIds.has(edge.toNodeId))

  const childCounts = new Map<
    string,
    Pick<
      DiscussionBoardNode,
      'challengeCount' | 'childCount' | 'questionCount' | 'responseCount' | 'supportCount'
    >
  >()

  for (const edge of edges) {
    const current = childCounts.get(edge.toNodeId) || {
      challengeCount: 0,
      childCount: 0,
      questionCount: 0,
      responseCount: 0,
      supportCount: 0,
    }

    current.childCount += 1

    if (edge.type === 'asks_about') {
      current.questionCount += 1
    } else {
      current.responseCount += 1
    }

    if (edge.type === 'challenges') {
      current.challengeCount += 1
    }

    if (edge.type === 'supports') {
      current.supportCount += 1
    }

    childCounts.set(edge.toNodeId, current)
  }

  const nodes = serializedNodes.map((node) => ({
    ...node,
    ...(childCounts.get(node.id) || {
      challengeCount: 0,
      childCount: 0,
      questionCount: 0,
      responseCount: 0,
      supportCount: 0,
    }),
  }))
  const rootNodes = nodes.filter((node) => node.isRoot)

  return {
    edges,
    nodes,
    rootNodes,
  }
}
