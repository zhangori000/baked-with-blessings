import type { Payload } from 'payload'

import { createStableHash, isUniqueConstraintError } from '@/utilities/idempotency'
import { BLESSINGS_NETWORK_TENANT_ID } from '@/features/blessings-network/types'

import { blessingsNetworkCollections, toBlessingsNetworkPayloadId } from './networkData'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  find: (args: unknown) => Promise<{ docs: Array<Record<string, unknown>> }>
  findByID: (args: unknown) => Promise<Record<string, unknown>>
}

const createError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

const cleanText = (value: unknown, maxLength = 240) => {
  if (typeof value !== 'string') return ''

  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

const cleanLongText = (value: unknown, maxLength = 2600) => {
  if (typeof value !== 'string') return ''

  return value.trim().slice(0, maxLength)
}

const normalizePublicUrl = (value: unknown) => {
  const raw = cleanText(value, 320)
  if (!raw) return ''

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''

    return url.toString()
  } catch {
    return ''
  }
}

const getAnswerSubmissionKey = ({
  headers,
  input,
  questionId,
}: {
  headers: Request['headers']
  input: Record<string, unknown>
  questionId: string
}) => {
  const clientKey =
    cleanText(input.idempotencyKey, 120) || headers.get('idempotency-key')?.trim() || ''

  if (clientKey) {
    return `blessings-network-answer:client:${createStableHash(
      JSON.stringify({ clientKey, questionId }),
      48,
    )}`
  }

  return `blessings-network-answer:${createStableHash(
    JSON.stringify({
      answer: cleanLongText(input.answer),
      businessName: cleanText(input.businessName),
      ownerName: cleanText(input.ownerName),
      questionId,
    }),
    48,
  )}`
}

const getOwnerPostSubmissionKey = ({
  headers,
  input,
}: {
  headers: Request['headers']
  input: Record<string, unknown>
}) => {
  const clientKey =
    cleanText(input.idempotencyKey, 120) || headers.get('idempotency-key')?.trim() || ''

  if (clientKey) {
    return `blessings-network-owner-post:client:${createStableHash(clientKey, 48)}`
  }

  return `blessings-network-owner-post:${createStableHash(
    JSON.stringify({
      body: cleanLongText(input.body),
      businessName: cleanText(input.businessName),
      ownerName: cleanText(input.ownerName),
      title: cleanText(input.postTitle),
    }),
    48,
  )}`
}

const findAnswerBySubmissionKey = async ({
  payload,
  submissionKey,
}: {
  payload: Payload
  submissionKey: string
}) => {
  const result = await (payload as LoosePayload).find({
    collection: blessingsNetworkCollections.answer,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      submissionKey: {
        equals: submissionKey,
      },
    },
  })

  return result.docs[0] || null
}

const findOwnerPostBySubmissionKey = async ({
  payload,
  submissionKey,
}: {
  payload: Payload
  submissionKey: string
}) => {
  const result = await (payload as LoosePayload).find({
    collection: blessingsNetworkCollections.ownerPost,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      submissionKey: {
        equals: submissionKey,
      },
    },
  })

  return result.docs[0] || null
}

export const createBlessingsNetworkAnswerSubmission = async ({
  headers,
  input,
  payload,
}: {
  headers: Request['headers']
  input: Record<string, unknown>
  payload: Payload
}) => {
  const questionId = cleanText(input.questionId, 80)
  if (!questionId) {
    throw createError('Choose a question before responding.')
  }

  const question = await (payload as LoosePayload).findByID({
    collection: blessingsNetworkCollections.question,
    depth: 0,
    id: questionId,
    overrideAccess: true,
  })

  if (!question || question.publicStatus !== 'published') {
    throw createError('That question is not available for public responses.', 404)
  }

  const ownerName = cleanText(input.ownerName, 90)
  const title = cleanText(input.title, 120)
  const businessName = cleanText(input.businessName, 120)
  const businessType = cleanText(input.businessType, 120)
  const location = cleanText(input.location, 120)
  const description = cleanLongText(input.description, 520)
  const bio = cleanLongText(input.bio, 1200)
  const contactEmail = cleanText(input.contactEmail, 180)
  const answer = cleanLongText(input.answer, 2600)
  const practicalTakeaway = cleanLongText(input.practicalTakeaway, 520)
  const websiteUrl = normalizePublicUrl(input.websiteUrl)
  const linkedinUrl = normalizePublicUrl(input.linkedinUrl)

  if (ownerName.length < 2) throw createError('Please add your name.')
  if (title.length < 2) throw createError('Please add your title.')
  if (businessName.length < 2) throw createError('Please add your business name.')
  if (location.length < 2) throw createError('Please add your business location.')
  if (description.length < 16) {
    throw createError('Please add a short description of what your business sells or serves.')
  }
  if (!websiteUrl && !linkedinUrl) {
    throw createError('Please add a website or LinkedIn link so visitors can find your business.')
  }
  if (answer.length < 40) {
    throw createError('Please write a little more detail in the reply.')
  }

  const submissionKey = getAnswerSubmissionKey({ headers, input, questionId })
  const existingAnswer = await findAnswerBySubmissionKey({ payload, submissionKey })

  if (existingAnswer) {
    return {
      id: existingAnswer.id,
      status: 'under_review',
    }
  }

  const owner = await (payload as LoosePayload).create({
    collection: blessingsNetworkCollections.owner,
    data: {
      bio: bio || undefined,
      businessName,
      businessType: businessType || undefined,
      contactEmail: contactEmail || undefined,
      description,
      linkedinUrl: linkedinUrl || undefined,
      location,
      ownerName,
      publicStatus: 'under_review',
      tenantId: BLESSINGS_NETWORK_TENANT_ID,
      title,
      websiteUrl: websiteUrl || undefined,
    },
    overrideAccess: true,
  })

  try {
    const createdAnswer = await (payload as LoosePayload).create({
      collection: blessingsNetworkCollections.answer,
      data: {
        answer,
        owner: owner.id,
        practicalTakeaway: practicalTakeaway || undefined,
        publicStatus: 'under_review',
        question: toBlessingsNetworkPayloadId(questionId),
        submittedByEmail: contactEmail || undefined,
        submissionKey,
        tenantId: BLESSINGS_NETWORK_TENANT_ID,
      },
      overrideAccess: true,
    })

    return {
      id: createdAnswer.id,
      status: 'under_review',
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicateAnswer = await findAnswerBySubmissionKey({ payload, submissionKey })

      if (duplicateAnswer) {
        return {
          id: duplicateAnswer.id,
          status: 'under_review',
        }
      }
    }

    throw error
  }
}

export const createBlessingsNetworkOwnerPostSubmission = async ({
  headers,
  input,
  payload,
}: {
  headers: Request['headers']
  input: Record<string, unknown>
  payload: Payload
}) => {
  const ownerName = cleanText(input.ownerName, 90)
  const title = cleanText(input.title, 120)
  const businessName = cleanText(input.businessName, 120)
  const businessType = cleanText(input.businessType, 120)
  const location = cleanText(input.location, 120)
  const description = cleanLongText(input.description, 520)
  const bio = cleanLongText(input.bio, 1200)
  const contactEmail = cleanText(input.contactEmail, 180)
  const postTitle = cleanText(input.postTitle, 150)
  const topic = cleanText(input.topic, 80)
  const body = cleanLongText(input.body, 2600)
  const practicalTakeaway = cleanLongText(input.practicalTakeaway, 520)
  const websiteUrl = normalizePublicUrl(input.websiteUrl)
  const linkedinUrl = normalizePublicUrl(input.linkedinUrl)

  if (ownerName.length < 2) throw createError('Please add your name.')
  if (title.length < 2) throw createError('Please add your title.')
  if (businessName.length < 2) throw createError('Please add your business name.')
  if (location.length < 2) throw createError('Please add your business location.')
  if (description.length < 16) {
    throw createError('Please add a short description of what your business sells or serves.')
  }
  if (!websiteUrl && !linkedinUrl) {
    throw createError('Please add a website or LinkedIn link so visitors can find your business.')
  }
  if (postTitle.length < 6) throw createError('Please add a clearer post title.')
  if (body.length < 40) throw createError('Please write a little more detail in the post.')

  const submissionKey = getOwnerPostSubmissionKey({ headers, input })
  const existingOwnerPost = await findOwnerPostBySubmissionKey({ payload, submissionKey })

  if (existingOwnerPost) {
    return {
      id: existingOwnerPost.id,
      status: 'under_review',
    }
  }

  const owner = await (payload as LoosePayload).create({
    collection: blessingsNetworkCollections.owner,
    data: {
      bio: bio || undefined,
      businessName,
      businessType: businessType || undefined,
      contactEmail: contactEmail || undefined,
      description,
      linkedinUrl: linkedinUrl || undefined,
      location,
      ownerName,
      publicStatus: 'under_review',
      tenantId: BLESSINGS_NETWORK_TENANT_ID,
      title,
      websiteUrl: websiteUrl || undefined,
    },
    overrideAccess: true,
  })

  try {
    const createdOwnerPost = await (payload as LoosePayload).create({
      collection: blessingsNetworkCollections.ownerPost,
      data: {
        body,
        owner: owner.id,
        practicalTakeaway: practicalTakeaway || undefined,
        publicStatus: 'under_review',
        submittedByEmail: contactEmail || undefined,
        submissionKey,
        tenantId: BLESSINGS_NETWORK_TENANT_ID,
        title: postTitle,
        topic: topic || undefined,
      },
      overrideAccess: true,
    })

    return {
      id: createdOwnerPost.id,
      status: 'under_review',
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicateOwnerPost = await findOwnerPostBySubmissionKey({ payload, submissionKey })

      if (duplicateOwnerPost) {
        return {
          id: duplicateOwnerPost.id,
          status: 'under_review',
        }
      }
    }

    throw error
  }
}
