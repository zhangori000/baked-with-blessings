import configPromise from '@payload-config'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import {
  findBallot,
  findCurrentPoll,
  tallyPoll,
  toPublicPoll,
} from '@/features/flavor-polls/services'
import { FLAVOR_POLL_VOTER_COOKIE, readVoterKey } from '@/features/flavor-polls/voterCookie'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'
import { getSitePages } from '@/utilities/getSitePages'
import { flavorVoteHref } from '@/utilities/routes'

import { SceneryPageHero } from '../menu/_components/scenery-page-hero.client'
import { VoteExperience } from './VoteExperience.client'
import '../menu/_components/catering-menu-hero.css'
import './vote.css'

export const dynamic = 'force-dynamic'

export const metadata = buildStaticMetadata({
  description:
    'Help pick next week’s Baked with Blessings cookies. Spend your cookie tokens on the flavors you want back.',
  path: flavorVoteHref,
  title: 'Flavor Vote',
})

const loadVoteData = async () => {
  const payload = await getPayload({ config: configPromise })
  const pollDoc = await findCurrentPoll(payload)
  if (!pollDoc) return null

  const poll = toPublicPoll(pollDoc)
  const cookieStore = await cookies()
  const voterKey = readVoterKey(cookieStore.get(FLAVOR_POLL_VOTER_COOKIE)?.value)
  const ballot = await findBallot(payload, poll.id, voterKey)
  const canSeeStandings = !poll.isOpen || (Boolean(ballot) && poll.showStandingsAfterVoting)
  const standings = canSeeStandings ? (await tallyPoll(payload, poll)).standings : null

  return { ballot, poll, standings }
}

export default async function VotePage() {
  const sitePages = await getSitePages()
  if (!sitePages.flavorVoteEnabled) {
    notFound()
  }

  const [initialSceneryTone, data] = await Promise.all([
    getMenuSceneToneFromCookies(),
    loadVoteData(),
  ])

  return (
    <div className="voteTypography">
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <SceneryPageHero
          eyebrow="Weekly flavor vote"
          initialSceneryTone={initialSceneryTone}
          summary="You pick, we bake. Spend your cookie tokens on the flavors you want next week, and check back when voting closes."
          title="Flavor Vote"
        />

        <section className="voteBand">
          <div className="voteShell container">
            <VoteExperience
              featureRequestsEnabled={sitePages.featureRequestsEnabled}
              initialBallot={data?.ballot ?? null}
              initialStandings={data?.standings ?? null}
              poll={data?.poll ?? null}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
