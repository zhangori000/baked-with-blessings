import { getDiscussionTreeData } from '@/features/discussion-graph/services/discussionData'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { DISCUSSION_BOARD_CONTENT_DEFAULTS } from '@/globals/DiscussionBoardContent'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { DiscussionBoardClient } from './DiscussionBoardClient'
import Loading from './loading'
import '../menu/_components/catering-menu-hero.css'
import './discussion-board.css'

const discussionSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description: 'Structured discussion board for questions, claims, evidence, and replies.',
  title: 'Discussion Board',
}

type Props = {
  searchParams?: Promise<{
    node?: string
    topic?: string
  }>
}

async function DiscussionBoardPageContent({ searchParams }: Props) {
  const sitePages = await getSitePages()
  if (!sitePages.discussionBoardEnabled) {
    notFound()
  }

  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const payload = await getPayload({ config })
  const [data, pageContent, params] = await Promise.all([
    getDiscussionTreeData(payload),
    payload.findGlobal({ slug: 'discussion-board-content', depth: 0 }),
    searchParams,
  ])

  const heroEyebrow = pageContent.eyebrow?.trim() || DISCUSSION_BOARD_CONTENT_DEFAULTS.eyebrow
  const heroTitle = pageContent.title?.trim() || DISCUSSION_BOARD_CONTENT_DEFAULTS.title
  const heroSummary = pageContent.summary?.trim() || DISCUSSION_BOARD_CONTENT_DEFAULTS.summary

  return (
    <div className={discussionSerif.variable}>
      <DiscussionBoardClient
        heroEyebrow={heroEyebrow}
        heroSummary={heroSummary}
        heroTitle={heroTitle}
        initialData={data}
        initialFocusedNodeId={params?.node}
        initialSceneryTone={initialSceneryTone}
        initialTopicId={params?.topic}
      />
    </div>
  )
}

export default function DiscussionBoardPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <DiscussionBoardPageContent {...props} />
    </Suspense>
  )
}
