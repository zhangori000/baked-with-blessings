import type { Payload } from 'payload'

import {
  BLESSINGS_NETWORK_TENANT_ID,
  type BlessingsNetworkPageData,
  type BlessingsNetworkQuestionStatus,
  type PublicNetworkAnswer,
  type PublicNetworkOwner,
  type PublicNetworkOwnerPost,
  type PublicNetworkQuestion,
} from '@/features/blessings-network/types'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  find: (args: unknown) => Promise<{ docs: Array<Record<string, unknown>> }>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

type StarterOwner = {
  bio: string
  businessName: string
  businessType: string
  description: string
  displayOrder: number
  linkedinUrl: string
  location: string
  ownerName: string
  title: string
  websiteUrl: string
}

type StarterAnswer = {
  answer: string
  displayOrder: number
  ownerBusinessName: string
  practicalTakeaway: string
  submissionKey: string
}

type StarterOwnerPost = {
  body: string
  displayOrder: number
  ownerBusinessName: string
  practicalTakeaway: string
  submissionKey: string
  title: string
  topic: string
}

const ownerCollection = 'blessings-network-owners'
const questionCollection = 'blessings-network-questions'
const answerCollection = 'blessings-network-answers'
const ownerPostCollection = 'blessings-network-owner-posts'

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return ''
}

const getRelationshipId = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'value' in value) return getRelationshipId(value.value)
  return toStringId(value)
}

const toPayloadId = (value: string) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && String(numeric) === value ? numeric : value
}

const cleanString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const getInitials = (name: string) => {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'BN'
}

const compareDisplayOrder = (left: Record<string, unknown>, right: Record<string, unknown>) => {
  const leftOrder = typeof left.displayOrder === 'number' ? left.displayOrder : 100
  const rightOrder = typeof right.displayOrder === 'number' ? right.displayOrder : 100

  if (leftOrder !== rightOrder) return leftOrder - rightOrder

  const leftCreated = new Date(cleanString(left.createdAt, new Date().toISOString())).getTime()
  const rightCreated = new Date(cleanString(right.createdAt, new Date().toISOString())).getTime()

  return leftCreated - rightCreated
}

const serializeOwner = (doc: Record<string, unknown>): PublicNetworkOwner => {
  const ownerName = cleanString(doc.ownerName, 'Business owner')

  return {
    bio: cleanString(doc.bio) || undefined,
    businessName: cleanString(doc.businessName, 'Local business'),
    businessType: cleanString(doc.businessType) || undefined,
    description: cleanString(doc.description, 'Local food business.'),
    id: toStringId(doc.id),
    initials: getInitials(ownerName),
    linkedinUrl: cleanString(doc.linkedinUrl) || undefined,
    location: cleanString(doc.location, 'Location shared soon'),
    ownerName,
    title: cleanString(doc.title, 'Owner'),
    websiteUrl: cleanString(doc.websiteUrl) || undefined,
  }
}

const serializeAnswer = ({
  doc,
  owner,
  questionId,
}: {
  doc: Record<string, unknown>
  owner: PublicNetworkOwner
  questionId: string
}): PublicNetworkAnswer => ({
  answer: cleanString(doc.answer),
  createdAt: cleanString(doc.createdAt, new Date().toISOString()),
  id: toStringId(doc.id),
  owner,
  practicalTakeaway: cleanString(doc.practicalTakeaway) || undefined,
  questionId,
})

const serializeOwnerPost = ({
  doc,
  owner,
}: {
  doc: Record<string, unknown>
  owner: PublicNetworkOwner
}): PublicNetworkOwnerPost => ({
  body: cleanString(doc.body),
  createdAt: cleanString(doc.createdAt, new Date().toISOString()),
  id: toStringId(doc.id),
  owner,
  practicalTakeaway: cleanString(doc.practicalTakeaway) || undefined,
  title: cleanString(doc.title, 'Owner insight'),
  topic: cleanString(doc.topic) || undefined,
})

const serializeQuestion = ({
  answers,
  doc,
}: {
  answers: PublicNetworkAnswer[]
  doc: Record<string, unknown>
}): PublicNetworkQuestion => ({
  answerCount: answers.length,
  answers,
  body: cleanString(doc.body),
  category: cleanString(doc.category) || undefined,
  createdAt: cleanString(doc.createdAt, new Date().toISOString()),
  id: toStringId(doc.id),
  questionStatus:
    doc.questionStatus === 'answered' || doc.questionStatus === 'archived'
      ? (doc.questionStatus as BlessingsNetworkQuestionStatus)
      : 'seeking_advice',
  title: cleanString(doc.title, 'Question'),
})

const starterQuestion = {
  body: 'For someone who has an idea for a cafe or food business but has never leased a commercial space, where do you actually begin? How did you find your first location, decide it was realistic, understand the lease or purchase process, estimate build-out costs, and avoid signing for a space that would hurt the business before it opened?',
  category: 'Physical location',
  displayOrder: 1,
  title: 'How do you find and secure a first storefront when you are starting from zero?',
}

const starterOwners: StarterOwner[] = [
  {
    bio: 'Maya opened Morning Hearth after running weekend pastry pop-ups for two years. Her cafe focuses on croissants, seasonal fruit pastries, espresso, and small breakfast boxes for neighborhood offices.',
    businessName: 'Morning Hearth Cafe',
    businessType: 'Cafe and pastry shop',
    description:
      'Neighborhood cafe serving laminated pastries, espresso, and weekend brunch boxes.',
    displayOrder: 1,
    linkedinUrl: 'https://www.linkedin.com/in/maya-chen-cafe-owner',
    location: 'Minneapolis, MN',
    ownerName: 'Maya Chen',
    title: 'Founder and Pastry Director',
    websiteUrl: 'https://morninghearth.example',
  },
  {
    bio: 'Andre runs a coffee and bakeshop that started in a shared kitchen before moving into a second-generation food space. His team sells espresso drinks, loaf cakes, savory hand pies, and rotating market boxes.',
    businessName: 'Juniper Street Coffee & Bakes',
    businessType: 'Coffee shop and bakery',
    description: 'Coffee shop with loaf cakes, hand pies, espresso drinks, and market boxes.',
    displayOrder: 2,
    linkedinUrl: 'https://www.linkedin.com/in/andre-williams-cafe-owner',
    location: 'St. Paul, MN',
    ownerName: 'Andre Williams',
    title: 'Owner and Operator',
    websiteUrl: 'https://juniperstreet.example',
  },
]

const starterAnswers: StarterAnswer[] = [
  {
    answer:
      'I would start by separating the dream of the room from the business requirements. A pretty storefront is not enough. Before signing anything, confirm zoning, food use, ventilation, electrical capacity, plumbing, grease interceptor needs, parking or pickup flow, and whether the landlord will contribute to build-out. I used a commercial broker, but I still brought in a contractor and attorney before the lease was final. The lease language mattered as much as the rent because the build-out timeline, personal guarantee, tenant improvement allowance, and repair responsibilities all affected whether the cafe could survive the first year.',
    displayOrder: 1,
    ownerBusinessName: 'Morning Hearth Cafe',
    practicalTakeaway:
      'Do not fall in love with a beautiful room until zoning, utilities, build-out costs, and lease terms make sense.',
    submissionKey: 'seed:blessings-network:first-storefront:morning-hearth',
  },
  {
    answer:
      'If you are just starting out, look hard at second-generation food spaces first. A former cafe, deli, or small restaurant may already have the plumbing, floor drains, hood route, customer restroom, and health department history you need. That does not mean it will be cheap, but it can reduce unknowns. I would call the city or county health department early, walk the space with a contractor who has food-service experience, and ask for utility bills if possible. The monthly rent is only one line. Security deposit, equipment, permits, architect drawings, signage, furniture, point of sale, insurance, and the months before opening can cost more than people expect.',
    displayOrder: 2,
    ownerBusinessName: 'Juniper Street Coffee & Bakes',
    practicalTakeaway:
      'A second-generation food space can save time, but only after a food-service contractor and health department confirm what is already usable.',
    submissionKey: 'seed:blessings-network:first-storefront:juniper-street',
  },
]

const starterOwnerPosts: StarterOwnerPost[] = [
  {
    body: 'The best early walkthrough I ever did was not with a friend or a designer. It was with a contractor who had actually opened food-service spaces. We looked for floor drains, hood routes, electrical panel capacity, restroom requirements, hand sink locations, grease interceptor needs, and whether the existing layout matched how people would queue and pick up. That walkthrough changed the way I read every listing after that.',
    displayOrder: 1,
    ownerBusinessName: 'Morning Hearth Cafe',
    practicalTakeaway:
      'Bring a food-service contractor into the conversation before you emotionally commit to a space.',
    submissionKey: 'seed:blessings-network:owner-post:first-walkthrough',
    title: 'Walk a potential space with someone who has built one before',
    topic: 'Storefront leases',
  },
]

export const ensureBlessingsNetworkStarterContent = async (payload: Payload) => {
  const loosePayload = payload as LoosePayload
  const now = new Date().toISOString()

  const questionResult = await loosePayload.find({
    collection: questionCollection,
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    sort: 'createdAt',
    where: {
      and: [
        { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
        { title: { equals: starterQuestion.title } },
      ],
    },
  })

  const question =
    questionResult.docs[0] ||
    (await loosePayload.create({
      collection: questionCollection,
      data: {
        ...starterQuestion,
        askedByName: 'Orianna Paxton',
        publicStatus: 'published',
        questionStatus: 'seeking_advice',
        tenantId: BLESSINGS_NETWORK_TENANT_ID,
      },
      overrideAccess: true,
    }))

  if (questionResult.docs[0]?.id) {
    await loosePayload.update({
      collection: questionCollection,
      data: {
        ...starterQuestion,
        publicStatus: 'published',
        questionStatus: 'seeking_advice',
      },
      id: questionResult.docs[0].id,
      overrideAccess: true,
    })

    for (const duplicateQuestion of questionResult.docs.slice(1)) {
      if (!duplicateQuestion.id) continue

      await loosePayload.update({
        collection: questionCollection,
        data: {
          moderationNote: 'Duplicate starter question hidden by seed sync.',
          publicStatus: 'declined',
        },
        id: duplicateQuestion.id,
        overrideAccess: true,
      })
    }
  }

  const ownersByBusinessName = new Map<string, Record<string, unknown>>()

  for (const owner of starterOwners) {
    const existing = await loosePayload.find({
      collection: ownerCollection,
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: 'createdAt',
      where: {
        and: [
          { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
          { businessName: { equals: owner.businessName } },
        ],
      },
    })

    const data = {
      ...owner,
      publicStatus: 'published',
      tenantId: BLESSINGS_NETWORK_TENANT_ID,
    }

    const savedOwner = existing.docs[0]?.id
      ? await loosePayload.update({
          collection: ownerCollection,
          data,
          id: existing.docs[0].id,
          overrideAccess: true,
        })
      : await loosePayload.create({
          collection: ownerCollection,
          data,
          overrideAccess: true,
        })

    ownersByBusinessName.set(owner.businessName, savedOwner)

    for (const duplicateOwner of existing.docs.slice(1)) {
      if (!duplicateOwner.id) continue

      await loosePayload.update({
        collection: ownerCollection,
        data: {
          moderationNote: 'Duplicate starter owner hidden by seed sync.',
          publicStatus: 'declined',
        },
        id: duplicateOwner.id,
        overrideAccess: true,
      })
    }
  }

  for (const starterAnswer of starterAnswers) {
    const owner = ownersByBusinessName.get(starterAnswer.ownerBusinessName)
    if (!owner?.id || !question.id) continue

    const existing = await loosePayload.find({
      collection: answerCollection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        submissionKey: {
          equals: starterAnswer.submissionKey,
        },
      },
    })

    const data = {
      answer: starterAnswer.answer,
      displayOrder: starterAnswer.displayOrder,
      owner: owner.id,
      practicalTakeaway: starterAnswer.practicalTakeaway,
      publicStatus: 'published',
      publishedAt: now,
      question: question.id,
      submissionKey: starterAnswer.submissionKey,
      tenantId: BLESSINGS_NETWORK_TENANT_ID,
    }

    if (existing.docs[0]?.id) {
      await loosePayload.update({
        collection: answerCollection,
        data,
        id: existing.docs[0].id,
        overrideAccess: true,
      })
    } else {
      await loosePayload.create({
        collection: answerCollection,
        data,
        overrideAccess: true,
      })
    }
  }

  for (const starterOwnerPost of starterOwnerPosts) {
    const owner = ownersByBusinessName.get(starterOwnerPost.ownerBusinessName)
    if (!owner?.id) continue

    const existing = await loosePayload.find({
      collection: ownerPostCollection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        submissionKey: {
          equals: starterOwnerPost.submissionKey,
        },
      },
    })

    const data = {
      body: starterOwnerPost.body,
      displayOrder: starterOwnerPost.displayOrder,
      owner: owner.id,
      practicalTakeaway: starterOwnerPost.practicalTakeaway,
      publicStatus: 'published',
      publishedAt: now,
      submissionKey: starterOwnerPost.submissionKey,
      tenantId: BLESSINGS_NETWORK_TENANT_ID,
      title: starterOwnerPost.title,
      topic: starterOwnerPost.topic,
    }

    if (existing.docs[0]?.id) {
      await loosePayload.update({
        collection: ownerPostCollection,
        data,
        id: existing.docs[0].id,
        overrideAccess: true,
      })
    } else {
      await loosePayload.create({
        collection: ownerPostCollection,
        data,
        overrideAccess: true,
      })
    }
  }
}

export const getBlessingsNetworkPageData = async (
  payload: Payload,
): Promise<BlessingsNetworkPageData> => {
  await ensureBlessingsNetworkStarterContent(payload)

  const loosePayload = payload as LoosePayload

  const [ownerResult, questionResult, answerResult, ownerPostResult] = await Promise.all([
    loosePayload.find({
      collection: ownerCollection,
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
          { publicStatus: { equals: 'published' } },
        ],
      },
    }),
    loosePayload.find({
      collection: questionCollection,
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
          { publicStatus: { equals: 'published' } },
        ],
      },
    }),
    loosePayload.find({
      collection: answerCollection,
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
          { publicStatus: { equals: 'published' } },
        ],
      },
    }),
    loosePayload.find({
      collection: ownerPostCollection,
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: BLESSINGS_NETWORK_TENANT_ID } },
          { publicStatus: { equals: 'published' } },
        ],
      },
    }),
  ])

  const ownerDocs = [...(ownerResult.docs as unknown as Array<Record<string, unknown>>)].sort(
    compareDisplayOrder,
  )
  const questionDocs = [...(questionResult.docs as unknown as Array<Record<string, unknown>>)].sort(
    compareDisplayOrder,
  )
  const answerDocs = [...(answerResult.docs as unknown as Array<Record<string, unknown>>)].sort(
    compareDisplayOrder,
  )
  const ownerPostDocs = [
    ...(ownerPostResult.docs as unknown as Array<Record<string, unknown>>),
  ].sort(compareDisplayOrder)
  const owners = ownerDocs.map(serializeOwner)
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]))
  const answersByQuestionId = new Map<string, PublicNetworkAnswer[]>()

  for (const answerDoc of answerDocs) {
    const questionId = getRelationshipId(answerDoc.question)
    const ownerId = getRelationshipId(answerDoc.owner)
    const owner = ownerById.get(ownerId)

    if (!questionId || !owner) continue

    const current = answersByQuestionId.get(questionId) || []
    current.push(serializeAnswer({ doc: answerDoc, owner, questionId }))
    answersByQuestionId.set(questionId, current)
  }

  const questions = questionDocs.map((questionDoc) => {
    const questionId = toStringId(questionDoc.id)
    return serializeQuestion({
      answers: answersByQuestionId.get(questionId) || [],
      doc: questionDoc,
    })
  })
  const ownerPosts = ownerPostDocs
    .map((ownerPostDoc) => {
      const ownerId = getRelationshipId(ownerPostDoc.owner)
      const owner = ownerById.get(ownerId)

      if (!owner) return null

      return serializeOwnerPost({ doc: ownerPostDoc, owner })
    })
    .filter(Boolean) as PublicNetworkOwnerPost[]

  return {
    ownerPosts,
    owners,
    questions,
    stats: {
      publishedAnswerCount: answerDocs.length,
      publishedOwnerCount: owners.length,
      publishedOwnerPostCount: ownerPosts.length,
      publishedQuestionCount: questions.length,
    },
  }
}

export const blessingsNetworkCollections = {
  answer: answerCollection,
  owner: ownerCollection,
  ownerPost: ownerPostCollection,
  question: questionCollection,
} as const

export const toBlessingsNetworkPayloadId = toPayloadId
