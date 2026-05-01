import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { getBlessingsNetworkPageData } from '@/features/blessings-network/services/networkData'
import config from '@/payload.config'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { BlessingsNetworkClient } from './BlessingsNetworkClient'
import Loading from './loading'
import '../menu/_components/catering-menu-hero.css'
import './blessings-network.css'

const blessingsNetworkSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description:
    'Community Advice collects practical guidance, owner posts, and business profiles from experienced food and cafe owners.',
  title: 'Community Advice',
}

async function BlessingsNetworkPageContent() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const payload = await getPayload({ config })
  const data = await getBlessingsNetworkPageData(payload)

  return (
    <div className={blessingsNetworkSerif.variable}>
      <BlessingsNetworkClient initialData={data} initialSceneryTone={initialSceneryTone} />
    </div>
  )
}

export default function BlessingsNetworkPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BlessingsNetworkPageContent />
    </Suspense>
  )
}
