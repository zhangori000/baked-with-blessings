import { COMMUNITY_PAGE_CONTENT_DEFAULTS } from '@/globals/CommunityPageContent'
import { fetchCommunityNotesPage } from '@/features/community/services'
import { COMMUNITY_NOTES_PAGE_SIZE } from '@/features/community/types'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { CommunityClient } from './CommunityClient'
import Loading from './loading'
import '../menu/_components/catering-menu-hero.css'
import './community.css'

const communitySerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description:
    'Tiny letters from people who just ordered with us. After every order, we ask if they want to leave a note for the world — what they got, what they were thinking.',
  title: 'Community Post-it Wall',
}

type Props = {
  searchParams?: Promise<{
    fromOrder?: string
  }>
}

async function CommunityPageContent({ searchParams }: Props) {
  const sitePages = await getSitePages()
  if (!sitePages.communityEnabled) {
    notFound()
  }

  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const [pageContent, viewer, params] = await Promise.all([
    payload.findGlobal({ slug: 'community-page-content', depth: 0 }),
    getAuthenticatedCustomer(payload, headers),
    searchParams,
  ])

  const initialPage = await fetchCommunityNotesPage({
    limit: COMMUNITY_NOTES_PAGE_SIZE,
    payload,
    viewer: viewer ? { id: viewer.id as number } : null,
  })

  const heroEyebrow = pageContent.eyebrow?.trim() || COMMUNITY_PAGE_CONTENT_DEFAULTS.eyebrow
  const heroTitle = pageContent.title?.trim() || COMMUNITY_PAGE_CONTENT_DEFAULTS.title
  const heroSummary = pageContent.summary?.trim() || COMMUNITY_PAGE_CONTENT_DEFAULTS.summary

  return (
    <div className={communitySerif.variable}>
      <CommunityClient
        fromOrderId={params?.fromOrder ?? null}
        heroEyebrow={heroEyebrow}
        heroSummary={heroSummary}
        heroTitle={heroTitle}
        initialPage={initialPage}
        initialSceneryTone={initialSceneryTone}
        isAuthenticated={Boolean(viewer)}
        viewerName={viewer?.name?.trim() ?? null}
      />
    </div>
  )
}

export default function CommunityPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <CommunityPageContent {...props} />
    </Suspense>
  )
}
