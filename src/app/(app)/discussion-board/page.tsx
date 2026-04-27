import { getDiscussionTreeData } from '@/features/discussion-graph/services/discussionData'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
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
  const payload = await getPayload({ config })
  const data = await getDiscussionTreeData(payload)
  const params = await searchParams

  return (
    <div className={discussionSerif.variable}>
      <DiscussionBoardClient
        initialData={data}
        initialFocusedNodeId={params?.node}
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
