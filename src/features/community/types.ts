export const COMMUNITY_NOTES_PAGE_SIZE = 24

export type CommunityNoteVoteValue = 'like' | 'dislike'

export type CommunityNoteItem = {
  productTitle: string
  quantity: number
}

export type CommunityNotePublic = {
  id: string
  body: string
  createdAt: string
  displayName: string
  isAnonymous: boolean
  items: CommunityNoteItem[]
  likeCount: number
  dislikeCount: number
  myVote: CommunityNoteVoteValue | null
}

export type CommunityNotesPage = {
  notes: CommunityNotePublic[]
  hasMore: boolean
  nextCursor: string | null
}
