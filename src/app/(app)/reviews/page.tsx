import { getReviewsPageData } from '@/features/reviews/services/reviewData'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { ReviewsClient } from './ReviewsClient'
import Loading from './loading'
import '../menu/_components/catering-menu-hero.css'
import './reviews.css'

const reviewSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description:
    'Public reviews, bakery responses, and visible action logs for Baked with Blessings.',
  title: 'Reviews',
}

async function ReviewsPageContent() {
  const payload = await getPayload({ config })
  const data = await getReviewsPageData(payload)

  return (
    <div className={reviewSerif.variable}>
      <ReviewsClient initialData={data} />
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReviewsPageContent />
    </Suspense>
  )
}
