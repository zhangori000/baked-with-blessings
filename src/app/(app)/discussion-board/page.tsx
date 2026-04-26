import { getDiscussionTreeData } from '@/features/discussion-graph/services/discussionData'
import config from '@/payload.config'
import { getPayload } from 'payload'

import { DiscussionBoardClient } from './DiscussionBoardClient'
import './discussion-board.css'

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

export default async function DiscussionBoardPage({ searchParams }: Props) {
  const payload = await getPayload({ config })
  const data = await getDiscussionTreeData(payload)
  const params = await searchParams

  return (
    <DiscussionBoardClient
      initialData={data}
      initialFocusedNodeId={params?.node}
      initialTopicId={params?.topic}
    />
  )
}
