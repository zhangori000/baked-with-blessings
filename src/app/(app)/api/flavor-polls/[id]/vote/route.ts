import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import {
  FlavorPollError,
  submitBallot,
  tallyPoll,
  toPublicPoll,
} from '@/features/flavor-polls/services'
import {
  FLAVOR_POLL_VOTER_COOKIE,
  createVoterToken,
  readVoterKey,
  voterCookieOptions,
} from '@/features/flavor-polls/voterCookie'
import type { FlavorPoll } from '@/payload-types'
import { getSitePages } from '@/utilities/getSitePages'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const POST = async (request: Request, { params }: RouteContext) => {
  try {
    const sitePages = await getSitePages()
    if (!sitePages.flavorVoteEnabled) {
      return Response.json({ error: 'Flavor voting is off.', success: false }, { status: 404 })
    }

    const { id } = await params
    const pollID = Number(id)
    if (!Number.isInteger(pollID)) {
      return Response.json({ error: 'Poll not found.', success: false }, { status: 404 })
    }

    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'flavor-polls',
      depth: 2,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: { id: { equals: pollID } },
    })
    const pollDoc = found.docs[0] as FlavorPoll | undefined
    if (!pollDoc) {
      return Response.json({ error: 'Poll not found.', success: false }, { status: 404 })
    }

    const cookieStore = await cookies()
    let token = cookieStore.get(FLAVOR_POLL_VOTER_COOKIE)?.value
    let voterKey = readVoterKey(token)
    if (!voterKey) {
      token = createVoterToken()
      voterKey = readVoterKey(token)
      cookieStore.set(FLAVOR_POLL_VOTER_COOKIE, token, voterCookieOptions)
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const poll = toPublicPoll(pollDoc)
    const ballot = await submitBallot({
      flavorIdea: raw.flavorIdea,
      payload,
      picks: raw.picks,
      poll,
      voterKey: voterKey as string,
    })
    const standings = poll.showStandingsAfterVoting
      ? (await tallyPoll(payload, poll)).standings
      : null

    return Response.json({ ballot, standings, success: true })
  } catch (error) {
    if (error instanceof FlavorPollError) {
      return Response.json({ error: error.message, success: false }, { status: error.status })
    }
    console.error('[flavor-polls/vote] POST failed', error)
    return Response.json({ error: 'Unable to save your votes.', success: false }, { status: 500 })
  }
}
