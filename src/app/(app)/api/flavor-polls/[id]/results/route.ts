import config from '@payload-config'
import { getPayload } from 'payload'

import { isAdminUser } from '@/access/utilities'
import { buildResultsShareMessage } from '@/features/flavor-polls/results'
import { tallyPoll, toPublicPoll } from '@/features/flavor-polls/services'
import type { FlavorPoll } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { flavorVoteResultsHref } from '@/utilities/routes'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const GET = async (request: Request, { params }: RouteContext) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Admins only.', success: false }, { status: 401 })
  }

  const { id } = await params
  const pollID = Number(id)
  if (!Number.isInteger(pollID)) {
    return Response.json({ error: 'Poll not found.', success: false }, { status: 404 })
  }

  const pollDoc = (await payload
    .findByID({ collection: 'flavor-polls', depth: 2, id: pollID, overrideAccess: true })
    .catch(() => null)) as FlavorPoll | null
  if (!pollDoc) {
    return Response.json({ error: 'Poll not found.', success: false }, { status: 404 })
  }

  const poll = toPublicPoll(pollDoc)
  const { flavorIdeas, standings } = await tallyPoll(payload, poll)
  const isLive = pollDoc.status === 'live'
  const hasClosed = new Date(pollDoc.closesAt).getTime() <= Date.now()
  const resultsUrl = `${getServerSideURL()}${flavorVoteResultsHref(poll.id)}`
  const canShare = isLive && hasClosed

  return Response.json({
    flavorIdeas,
    hasClosed,
    isLive,
    isOpen: poll.isOpen,
    resultsUrl: canShare ? resultsUrl : null,
    shareMessage: canShare
      ? buildResultsShareMessage({ rows: standings.rows, url: resultsUrl })
      : null,
    standings,
    success: true,
  })
}
