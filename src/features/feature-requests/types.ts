export const FEATURE_REQUESTS_PAGE_SIZE = 12

export type FeatureRequestSortMode = 'newest' | 'top-rated'

export type FeatureRequestPublic = {
  id: string
  title: string
  body: string
  displayName: string
  isAnonymous: boolean
  ratingCount: number
  averageRating: number
  myRating: number | null
  commentCount: number
  createdAt: string
}

export type FeatureRequestCommentPublic = {
  id: string
  body: string
  createdAt: string
  displayName: string
  isAnonymous: boolean
}

export type FeatureRequestsPage = {
  hasMore: boolean
  nextCursor: string | null
  requests: FeatureRequestPublic[]
  sort: FeatureRequestSortMode
}
