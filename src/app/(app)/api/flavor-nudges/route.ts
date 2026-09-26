import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import {
  NUDGE_OWNER_ALERTS_PER_HOUR,
  countNudgesFor,
  countRecentNudges,
  findVoterNudgeIDs,
  loadNudgeFlavors,
  submitNudges,
} from '@/features/flavor-nudges/service'
import {
  FlavorNudgeError,
  normalizeNudgeEmail,
  parseNudgeProductIDs,
} from '@/features/flavor-nudges/validation'
import {
  FLAVOR_POLL_VOTER_COOKIE,
  createVoterToken,
  readVoterKey,
  voterCookieOptions,
} from '@/features/flavor-polls/voterCookie'
import { sendOwnerFlavorNudgeNotification } from '@/utilities/email/sendOwnerFlavorNudgeNotification'

export const dynamic = 'force-dynamic'

const ONE_HOUR_MS = 60 * 60 * 1000

export const GET = async () => {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    const voterKey = readVoterKey(cookieStore.get(FLAVOR_POLL_VOTER_COOKIE)?.value)
    const nudged = await findVoterNudgeIDs(payload, voterKey)

    return Response.json({ nudged, success: true })
  } catch (error) {
    console.error('[flavor-nudges] GET failed', error)
    return Response.json({ nudged: [], success: false }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  try {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const flavors = await loadNudgeFlavors()
    const titleByID = new Map(flavors.map((flavor) => [flavor.productId, flavor.title]))
    const productIDs = parseNudgeProductIDs(raw.productIds, new Set(titleByID.keys()))
    const email = normalizeNudgeEmail(raw.email)

    const cookieStore = await cookies()
    let token = cookieStore.get(FLAVOR_POLL_VOTER_COOKIE)?.value
    let voterKey = readVoterKey(token)
    if (!voterKey) {
      token = createVoterToken()
      voterKey = readVoterKey(token)
      cookieStore.set(FLAVOR_POLL_VOTER_COOKIE, token, voterCookieOptions)
    }

    const payload = await getPayload({ config })
    const { created, nudged } = await submitNudges({
      email,
      payload,
      productIDs,
      voterKey: voterKey as string,
    })

    if (created.length > 0) {
      try {
        const recent = await countRecentNudges(payload, new Date(Date.now() - ONE_HOUR_MS))
        if (recent <= NUDGE_OWNER_ALERTS_PER_HOUR) {
          const counts = await countNudgesFor(payload, created)
          await sendOwnerFlavorNudgeNotification({
            email,
            flavors: created.map((productID) => ({
              count: counts.get(productID) ?? 1,
              title: titleByID.get(productID) ?? 'An old flavor',
            })),
            payload,
          })
        } else {
          payload.logger.warn('Flavor nudge alerts paused: too many nudges in the last hour.')
        }
      } catch (error) {
        payload.logger.error({ err: error, msg: 'Failed to send flavor nudge owner alert' })
      }
    }

    return Response.json({ nudged, success: true })
  } catch (error) {
    if (error instanceof FlavorNudgeError) {
      return Response.json({ error: error.message, success: false }, { status: error.status })
    }
    console.error('[flavor-nudges] POST failed', error)
    return Response.json(
      { error: 'We could not send your nudge. Please try again.', success: false },
      { status: 500 },
    )
  }
}
