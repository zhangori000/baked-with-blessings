import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { loadClosedResults, loadNextVoteStatus } from '@/features/flavor-polls/landing'
import { findLivePollByID, findOpenPoll } from '@/features/flavor-polls/services'
import { FLAVOR_POLL_VOTER_COOKIE, readVoterKey } from '@/features/flavor-polls/voterCookie'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'
import { getSitePages } from '@/utilities/getSitePages'
import { flavorVoteHref, flavorVoteResultsHref } from '@/utilities/routes'

import { SceneryPageHero } from '../../../menu/_components/scenery-page-hero.client'
import { ClosedResults } from '../../VoteResults.client'
import '../../../menu/_components/catering-menu-hero.css'
import '../../vote.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { id } = await params

  return buildStaticMetadata({
    description: 'See which cookies won the Baked with Blessings flavor vote.',
    path: flavorVoteResultsHref(id),
    title: 'Flavor Vote Results',
  })
}

export default async function FlavorVoteResultsPage({ params }: PageProps) {
  const sitePages = await getSitePages()
  if (!sitePages.flavorVoteEnabled) notFound()

  const { id } = await params
  const pollID = Number(id)
  if (!Number.isInteger(pollID) || pollID < 1) notFound()

  const payload = await getPayload({ config: configPromise })
  const now = new Date()
  const pollDoc = await findLivePollByID(payload, pollID)
  if (!pollDoc) notFound()
  if (new Date(pollDoc.closesAt).getTime() > now.getTime()) redirect(flavorVoteHref)

  const cookieStore = await cookies()
  const voterKey = readVoterKey(cookieStore.get(FLAVOR_POLL_VOTER_COOKIE)?.value)
  const openPoll = await findOpenPoll(payload, now)
  const [initialSceneryTone, results, next] = await Promise.all([
    getMenuSceneToneFromCookies(),
    loadClosedResults(payload, pollDoc, voterKey),
    loadNextVoteStatus(payload, { hasOpenPoll: Boolean(openPoll), now }),
  ])

  return (
    <div className="voteTypography">
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <SceneryPageHero
          eyebrow="Flavor vote results"
          initialSceneryTone={initialSceneryTone}
          summary="You voted, we counted. Here are the flavors that won, and when the next vote opens."
          title="The Results Are In"
        />

        <section className="voteBand">
          <div className="voteShell container">
            <ClosedResults next={next} results={results} />
          </div>
        </section>
      </div>
    </div>
  )
}
