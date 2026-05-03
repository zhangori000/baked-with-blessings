import { fetchRequestsPage } from '@/features/feature-requests/services'
import {
  FEATURE_REQUESTS_PAGE_SIZE,
  type FeatureRequestSortMode,
} from '@/features/feature-requests/types'
import { FEATURE_REQUESTS_CONTENT_DEFAULTS } from '@/globals/FeatureRequestsContent'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { FeatureRequestsClient } from './FeatureRequestsClient'
import Loading from './loading'
import '../menu/_components/catering-menu-hero.css'
import './feature-requests.css'

const featureRequestsSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description:
    'Submit feature requests for the bakery — public so others can rate and comment, or privately as a direct message to the owner.',
  title: 'Request Features',
}

type Props = {
  searchParams?: Promise<{
    sort?: string
  }>
}

const parseSort = (raw?: string): FeatureRequestSortMode => {
  return raw === 'top-rated' ? 'top-rated' : 'newest'
}

async function FeatureRequestsPageContent({ searchParams }: Props) {
  const sitePages = await getSitePages()
  if (!sitePages.featureRequestsEnabled) {
    notFound()
  }

  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const [pageContent, viewer, params] = await Promise.all([
    payload.findGlobal({ slug: 'feature-requests-content', depth: 0 }),
    getAuthenticatedCustomer(payload, headers),
    searchParams,
  ])

  const sort = parseSort(params?.sort)

  const initialPage = await fetchRequestsPage({
    limit: FEATURE_REQUESTS_PAGE_SIZE,
    payload,
    sort,
    viewer: viewer ? { id: viewer.id as number } : null,
  })

  const heroEyebrow = pageContent.eyebrow?.trim() || FEATURE_REQUESTS_CONTENT_DEFAULTS.eyebrow
  const heroTitle = pageContent.title?.trim() || FEATURE_REQUESTS_CONTENT_DEFAULTS.title
  const heroSummary = pageContent.summary?.trim() || FEATURE_REQUESTS_CONTENT_DEFAULTS.summary

  return (
    <div className={featureRequestsSerif.variable}>
      <FeatureRequestsClient
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

export default function FeatureRequestsPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <FeatureRequestsPageContent {...props} />
    </Suspense>
  )
}
