import type { Payload } from 'payload'

import { buildSearchText, normalizeTags } from '@/features/discussion-graph/content'
import {
  getDiscussionActorKey,
  getDiscussionVisitor,
} from '@/features/discussion-graph/services/discussionIdentity'
import {
  DISCUSSION_TENANT_ID,
  type ContentBlock,
  type DiscussionContent,
  type DiscussionEdgeType,
  type DiscussionNodeType,
} from '@/features/discussion-graph/types'
import { createStableHash, isUniqueConstraintError } from '@/utilities/idempotency'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  db: {
    updateOne: (args: unknown) => Promise<unknown>
  }
  find: (args: unknown) => Promise<{ docs: Record<string, unknown>[] }>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

const getRelationshipId = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'value' in value) return getRelationshipId(value.value)
  if (typeof value === 'object' && 'id' in value) return String(value.id)
  return ''
}

const toPayloadId = (value: string) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && String(numeric) === value ? numeric : value
}

const createError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

const isValidEdgeType = (value: unknown): value is DiscussionEdgeType => {
  return (
    value === 'responds_to' ||
    value === 'asks_about' ||
    value === 'supports' ||
    value === 'challenges' ||
    value === 'related_to'
  )
}

const isValidNodeType = (value: unknown): value is DiscussionNodeType => {
  return value === 'question' || value === 'statement'
}

const extractUrls = (value: string) => {
  return Array.from(new Set(value.match(/https?:\/\/[^\s)]+/g) || []))
}

const getFirstMeaningfulLine = (value: string) => {
  return (
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || ''
  )
}

const trimTitle = (value: string) => {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= 92) return compact
  return `${compact.slice(0, 89).trim()}...`
}

const parseClaimGroup = (value: unknown, index: number): ContentBlock[] => {
  if (typeof value !== 'string' || !value.trim()) return []

  const sections: Record<'claim' | 'evidence' | 'uncertainty', string[]> = {
    claim: [],
    evidence: [],
    uncertainty: [],
  }
  let activeSection: keyof typeof sections = 'claim'

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim()
    const lower = line.toLowerCase()

    if (/^(claims?|conclusions?):/.test(lower)) {
      activeSection = 'claim'
      sections.claim.push(line.replace(/^(claims?|conclusions?):/i, '').trim())
      continue
    }

    if (
      /^evidence(?:\s*\(s\))?:/.test(lower) ||
      /^premises?(?:\s*\(s\))?:/.test(lower) ||
      /^sources?:/.test(lower)
    ) {
      activeSection = 'evidence'
      sections.evidence.push(
        line
          .replace(/^evidence(?:\s*\(s\))?:/i, '')
          .replace(/^premises?(?:\s*\(s\))?:/i, '')
          .replace(/^sources?:/i, '')
          .trim(),
      )
      continue
    }

    if (/^uncertainty:/.test(lower)) {
      activeSection = 'uncertainty'
      sections.uncertainty.push(line.replace(/^uncertainty:/i, '').trim())
      continue
    }

    sections[activeSection].push(rawLine)
  }

  const claim = sections.claim.join('\n').trim()
  const evidence = sections.evidence.join('\n').trim()
  const uncertainty = sections.uncertainty.join('\n').trim()
  const urls = extractUrls(evidence)
  const blocks: ContentBlock[] = []

  if (claim) {
    blocks.push({
      id: `claim_${index}`,
      text: claim,
      type: 'claim',
    })
  }

  if (evidence) {
    blocks.push({
      evidenceKind: urls.length ? 'source' : 'reasoning',
      id: `evidence_${index}`,
      text: evidence,
      type: 'evidence',
      ...(urls.length ? { url: urls[0], urls } : {}),
    })
  }

  if (uncertainty) {
    blocks.push({
      id: `uncertainty_${index}`,
      text: uncertainty,
      type: 'uncertainty',
    })
  }

  return blocks
}

const buildReplyContent = (input: {
  backgroundText?: unknown
  claim?: unknown
  claimGroups?: unknown
  bodyText?: unknown
  evidenceKind?: unknown
  evidenceText?: unknown
  evidenceUrl?: unknown
  questionText?: unknown
  sourceUrls?: unknown
  uncertainty?: unknown
  nodeType?: DiscussionNodeType
}): DiscussionContent => {
  const nodeType = input.nodeType || 'statement'
  const questionText = typeof input.questionText === 'string' ? input.questionText.trim() : ''
  const backgroundText = typeof input.backgroundText === 'string' ? input.backgroundText.trim() : ''
  const groupBlocks = Array.isArray(input.claimGroups)
    ? input.claimGroups.flatMap((group, index) => parseClaimGroup(group, index + 1))
    : []
  if (nodeType === 'question') {
    return {
      blocks: [
        ...(questionText
          ? [
              {
                id: 'question_1',
                text: questionText,
                type: 'question' as const,
              },
            ]
          : []),
        ...(backgroundText
          ? [
              {
                id: 'background_1',
                text: backgroundText,
                type: 'background' as const,
              },
            ]
          : []),
      ],
    }
  }

  if (groupBlocks.length > 0) {
    return { blocks: groupBlocks }
  }

  const bodyText = typeof input.bodyText === 'string' ? input.bodyText.trim() : ''
  if (bodyText) {
    return {
      blocks: [
        {
          id: 'body_1',
          text: bodyText,
          type: 'body',
        },
      ],
    }
  }

  const claim = typeof input.claim === 'string' ? input.claim.trim() : ''
  const evidenceText = typeof input.evidenceText === 'string' ? input.evidenceText.trim() : ''
  const uncertainty = typeof input.uncertainty === 'string' ? input.uncertainty.trim() : ''
  const evidenceKind =
    input.evidenceKind === 'source' ||
    input.evidenceKind === 'direct_experience' ||
    input.evidenceKind === 'reasoning'
      ? input.evidenceKind
      : 'reasoning'
  const evidenceUrl = typeof input.evidenceUrl === 'string' ? input.evidenceUrl.trim() : ''
  const sourceUrls =
    typeof input.sourceUrls === 'string'
      ? input.sourceUrls
          .split(/\r?\n/)
          .map((url) => url.trim())
          .filter(Boolean)
      : []
  const urls = Array.from(new Set([evidenceUrl, ...sourceUrls].filter(Boolean)))
  const blocks: ContentBlock[] = []

  if (claim) {
    blocks.push({
      id: 'claim_1',
      text: claim,
      type: 'claim',
    })
  }

  if (evidenceText) {
    blocks.push({
      evidenceKind,
      id: 'evidence_1',
      text: evidenceText,
      type: 'evidence',
      ...(evidenceKind === 'source' && urls.length ? { url: urls[0], urls } : {}),
    })
  }

  if (uncertainty) {
    blocks.push({
      id: 'uncertainty_1',
      text: uncertainty,
      type: 'uncertainty',
    })
  }

  return { blocks }
}

const getCounterIncrementUpdate = (edgeType: DiscussionEdgeType) => {
  const update: Record<string, { $inc: number }> = {
    childCount: { $inc: 1 },
    responseCount: { $inc: 1 },
  }

  if (edgeType === 'asks_about') {
    update.questionCount = { $inc: 1 }
  }

  if (edgeType === 'supports') {
    update.supportCount = { $inc: 1 }
  }

  if (edgeType === 'challenges') {
    update.challengeCount = { $inc: 1 }
  }

  return update
}

const getReplySubmissionKey = ({
  actorKey,
  content,
  edgeType,
  headers,
  input,
  nodeType,
  parentNodeId,
  title,
}: {
  actorKey: string
  content: DiscussionContent
  edgeType: DiscussionEdgeType
  headers: Request['headers']
  input: Record<string, unknown>
  nodeType: DiscussionNodeType
  parentNodeId: string
  title: string
}) => {
  const clientKey =
    typeof input.idempotencyKey === 'string' && input.idempotencyKey.trim()
      ? input.idempotencyKey.trim()
      : headers.get('idempotency-key')?.trim() || ''
  const keyMaterial = clientKey
    ? `client:${clientKey}`
    : JSON.stringify({
        content,
        edgeType,
        nodeType,
        parentNodeId,
        title,
      })

  return `reply:${actorKey}:${createStableHash(keyMaterial, 48)}`
}

const findDiscussionNodeBySubmissionKey = async ({
  payload,
  submissionKey,
}: {
  payload: Payload
  submissionKey: string
}) => {
  const existing = await (payload as LoosePayload).find({
    collection: 'discussion-nodes',
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

  return existing.docs[0] || null
}

export const createDiscussionReply = async ({
  headers,
  input,
  payload,
}: {
  headers: Request['headers']
  input: Record<string, unknown>
  payload: Payload
}) => {
  const { user } = await payload.auth({ headers })

  const parentNodeId = typeof input.parentNodeId === 'string' ? input.parentNodeId : ''
  const edgeType = isValidEdgeType(input.edgeType) ? input.edgeType : 'responds_to'
  const nodeType = isValidNodeType(input.nodeType) ? input.nodeType : 'statement'
  const authorDisplayName =
    typeof input.displayName === 'string' && input.displayName.trim()
      ? input.displayName.trim().slice(0, 80)
      : user && typeof user.name === 'string' && user.name.trim()
        ? user.name.trim()
        : 'Anonymous neighbor'
  const tags =
    Array.isArray(input.tags) && input.tags.every((tag) => typeof tag === 'string')
      ? normalizeTags(input.tags)
      : []

  if (!parentNodeId) {
    throw createError('Choose a parent node before replying.')
  }

  const content = buildReplyContent({ ...input, nodeType })
  const fallbackTitle =
    nodeType === 'question' ? `${authorDisplayName} asks` : `${authorDisplayName} says`
  const title =
    typeof input.title === 'string' && input.title.trim() ? trimTitle(input.title) : fallbackTitle

  if (nodeType === 'statement' && !content.blocks.some((block) => block.text.trim())) {
    throw createError('Write something before posting.')
  }

  if (nodeType === 'question' && !content.blocks.some((block) => block.type === 'question')) {
    throw createError('Questions need a question.')
  }

  const questionText = content.blocks.find((block) => block.type === 'question')?.text || ''
  if (nodeType === 'question' && !getFirstMeaningfulLine(questionText).endsWith('?')) {
    throw createError('Questions should be written as a question.')
  }

  const parent = (await payload.findByID({
    collection: 'discussion-nodes',
    depth: 0,
    id: parentNodeId,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>

  if (!parent || parent.moderationStatus === 'hidden') {
    throw createError('That parent discussion node is not available.', 404)
  }

  const rootNodeId = parent.isRoot ? String(parent.id) : getRelationshipId(parent.rootNode)
  const rootId = rootNodeId || String(parent.id)
  const parentPayloadId = toPayloadId(parentNodeId)
  const rootPayloadId = toPayloadId(rootId)
  const now = new Date().toISOString()
  const visitor = getDiscussionVisitor(headers)
  const actorKey = getDiscussionActorKey({
    user,
    visitorKey: visitor.visitorKey,
  })
  const submissionKey = getReplySubmissionKey({
    actorKey,
    content,
    edgeType,
    headers,
    input,
    nodeType,
    parentNodeId,
    title,
  })
  const existingNode = await findDiscussionNodeBySubmissionKey({ payload, submissionKey })

  if (existingNode) {
    return existingNode
  }

  let createdNode: Record<string, unknown>

  try {
    createdNode = await (payload as LoosePayload).create({
      collection: 'discussion-nodes',
      data: {
        ...(user && (user.collection === 'customers' || user.collection === 'admins')
          ? {
              author: {
                relationTo: user.collection,
                value: user.id,
              },
            }
          : {}),
        authorDisplayName,
        content,
        isRoot: false,
        lastActivityAt: now,
        moderationStatus: 'visible',
        rootNode: rootPayloadId,
        searchText: buildSearchText({ content, tags, title }),
        submissionKey,
        tags: tags.map((tag) => ({ tag })),
        tenantId: DISCUSSION_TENANT_ID,
        title,
        type: nodeType,
      },
      overrideAccess: true,
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicateNode = await findDiscussionNodeBySubmissionKey({ payload, submissionKey })

      if (duplicateNode) {
        return duplicateNode
      }
    }

    throw error
  }

  await (payload as LoosePayload).create({
    collection: 'discussion-edges',
    data: {
      fromNode: createdNode.id,
      rootNode: rootPayloadId,
      tenantId: DISCUSSION_TENANT_ID,
      toBlockIds: Array.isArray(input.parentBlockIds)
        ? input.parentBlockIds
            .filter((blockId) => typeof blockId === 'string' && blockId.trim())
            .map((blockId) => ({ blockId }))
        : [],
      toNode: parentPayloadId,
      type: edgeType,
    },
    overrideAccess: true,
  })

  await (payload as LoosePayload).db.updateOne({
    collection: 'discussion-nodes',
    data: {
      ...getCounterIncrementUpdate(edgeType),
      lastActivityAt: now,
    },
    id: toPayloadId(parentNodeId),
  })

  if (rootId !== parentNodeId) {
    await (payload as LoosePayload).db.updateOne({
      collection: 'discussion-nodes',
      data: {
        lastActivityAt: now,
      },
      id: toPayloadId(rootId),
    })
  }

  return createdNode
}

export const raiseNodeAwareness = async ({
  headers,
  nodeId,
  payload,
  reactionType = 'awareness',
}: {
  headers: Request['headers']
  nodeId: string
  payload: Payload
  reactionType?: 'awareness' | 'cry' | 'wiltedRose'
}) => {
  if (!nodeId) {
    throw createError('Choose a node first.')
  }

  const { user } = await payload.auth({ headers })
  const visitor = getDiscussionVisitor(headers)
  const actorKey = getDiscussionActorKey({
    user,
    visitorKey: visitor.visitorKey,
  })
  const dedupeKey = `awareness:${nodeId}:${reactionType}:${actorKey}`

  const node = (await payload.findByID({
    collection: 'discussion-nodes',
    depth: 0,
    id: nodeId,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>

  const countField =
    reactionType === 'cry'
      ? 'cryCount'
      : reactionType === 'wiltedRose'
        ? 'wiltedRoseCount'
        : 'awarenessCount'

  try {
    await (payload as LoosePayload).create({
      collection: 'awareness-marks',
      data: {
        dedupeKey,
        node: toPayloadId(nodeId),
        reactionType,
        tenantId: DISCUSSION_TENANT_ID,
        ...(user && (user.collection === 'customers' || user.collection === 'admins')
          ? {
              user: {
                relationTo: user.collection,
                value: user.id,
              },
            }
          : {
              visitorKey: visitor.visitorKey,
            }),
      },
      overrideAccess: true,
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { alreadyMarked: true, node: nodeId, reactionType }
    }

    throw error
  }

  await (payload as LoosePayload).db.updateOne({
    collection: 'discussion-nodes',
    data: {
      [countField]: { $inc: 1 },
    },
    id: toPayloadId(String(node.id || nodeId)),
  })

  return { alreadyMarked: false, node: nodeId, reactionType }
}
