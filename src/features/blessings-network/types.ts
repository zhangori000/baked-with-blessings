export const BLESSINGS_NETWORK_TENANT_ID = 'baked-with-blessings'

export const blessingsNetworkPublicStatuses = ['under_review', 'published', 'declined'] as const
export type BlessingsNetworkPublicStatus = (typeof blessingsNetworkPublicStatuses)[number]

export const blessingsNetworkQuestionStatuses = ['seeking_advice', 'answered', 'archived'] as const
export type BlessingsNetworkQuestionStatus = (typeof blessingsNetworkQuestionStatuses)[number]

export type PublicNetworkOwner = {
  bio?: string
  businessName: string
  businessType?: string
  description: string
  id: string
  initials: string
  linkedinUrl?: string
  location: string
  ownerName: string
  title: string
  websiteUrl?: string
}

export type PublicNetworkAnswer = {
  answer: string
  createdAt: string
  id: string
  owner: PublicNetworkOwner
  practicalTakeaway?: string
  questionId: string
}

export type PublicNetworkOwnerPost = {
  body: string
  createdAt: string
  id: string
  owner: PublicNetworkOwner
  practicalTakeaway?: string
  topic?: string
  title: string
}

export type PublicNetworkQuestion = {
  answerCount: number
  answers: PublicNetworkAnswer[]
  body: string
  category?: string
  createdAt: string
  id: string
  questionStatus: BlessingsNetworkQuestionStatus
  title: string
}

export type BlessingsNetworkPageData = {
  ownerPosts: PublicNetworkOwnerPost[]
  owners: PublicNetworkOwner[]
  questions: PublicNetworkQuestion[]
  stats: {
    publishedAnswerCount: number
    publishedOwnerCount: number
    publishedOwnerPostCount: number
    publishedQuestionCount: number
  }
}
