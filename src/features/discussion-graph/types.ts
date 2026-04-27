export const DISCUSSION_TENANT_ID = 'baked-with-blessings'

export const nodeTypes = ['question', 'statement'] as const
export type DiscussionNodeType = (typeof nodeTypes)[number]

export const edgeTypes = [
  'responds_to',
  'asks_about',
  'supports',
  'challenges',
  'related_to',
] as const
export type DiscussionEdgeType = (typeof edgeTypes)[number]

export const moderationStatuses = ['visible', 'hidden'] as const
export type DiscussionModerationStatus = (typeof moderationStatuses)[number]

export const authorStates = ['current', 'reconsidered'] as const
export type DiscussionAuthorState = (typeof authorStates)[number]

export type ContentBlock =
  | {
      id: string
      text: string
      type: 'body'
    }
  | {
      id: string
      text: string
      type: 'background'
    }
  | {
      id: string
      text: string
      type: 'question'
    }
  | {
      id: string
      text: string
      type: 'claim'
    }
  | {
      evidenceKind: 'source' | 'direct_experience' | 'reasoning'
      id: string
      text: string
      type: 'evidence'
      url?: string
      urls?: string[]
    }
  | {
      id: string
      text: string
      type: 'uncertainty'
    }

export type DiscussionContent = {
  blocks: ContentBlock[]
}

export type DiscussionBoardNode = {
  authorName: string
  authorState: DiscussionAuthorState
  awarenessCount: number
  challengeCount: number
  childCount: number
  createdAt: string
  cryCount: number
  id: string
  isRoot: boolean
  lastActivityAt: string
  moderationStatus: DiscussionModerationStatus
  questionCount: number
  responseCount: number
  searchText: string
  content: DiscussionContent
  shortPreview: string
  supportCount: number
  tags: string[]
  title: string
  type: DiscussionNodeType
  updatedAt: string
  wiltedRoseCount: number
}

export type DiscussionBoardEdge = {
  fromNodeId: string
  id: string
  toBlockIds: string[]
  toNodeId: string
  type: DiscussionEdgeType
}

export type DiscussionTreeData = {
  edges: DiscussionBoardEdge[]
  nodes: DiscussionBoardNode[]
  rootNodes: DiscussionBoardNode[]
}

export type DiscussionSortKey = 'most_discussed' | 'newly_active' | 'recent'

export const discussionSorts: Array<{ label: string; value: DiscussionSortKey }> = [
  { label: 'Recent', value: 'recent' },
  { label: 'Newly active', value: 'newly_active' },
  { label: 'Most discussed', value: 'most_discussed' },
]

export const edgeLabels: Record<DiscussionEdgeType, string> = {
  asks_about: 'follow-up questions',
  challenges: 'challenge replies',
  related_to: 'related to',
  responds_to: 'replies',
  supports: 'support replies',
}
