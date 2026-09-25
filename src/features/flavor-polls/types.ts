import type { Media } from '@/payload-types'

export type PollOption = {
  fallbackSrc: string
  image: Media | null
  productId: number
  slug: string
  summary: string
  title: string
}

export type PublicPoll = {
  allowFlavorIdeas: boolean
  closesAt: string
  id: number
  isOpen: boolean
  opensAt: string | null
  options: PollOption[]
  showStandingsAfterVoting: boolean
  title: string
  votesPerPerson: number
}

export type PollBallot = {
  flavorIdea: string
  picks: Record<number, number>
}

export type PollStandingsRow = {
  productId: number
  rank: number
  title: string
  votes: number
}

export type PollStandings = {
  rows: PollStandingsRow[]
  totalVotes: number
  voterCount: number
}

export type NextVoteStatus =
  | { kind: 'open' }
  | { kind: 'scheduled'; opensAt: string }
  | { kind: 'unknown' }

export type ClosedPollResults = {
  myPicks: Record<number, number>
  poll: PublicPoll
  standings: PollStandings
}
