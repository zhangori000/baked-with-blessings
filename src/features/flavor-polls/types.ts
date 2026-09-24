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
  title: string
  votes: number
}

export type PollStandings = {
  rows: PollStandingsRow[]
  totalVotes: number
  voterCount: number
}
