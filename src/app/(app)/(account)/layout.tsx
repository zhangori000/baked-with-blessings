import type { ReactNode } from 'react'

import '../menu/_components/catering-menu-hero.css'

import { BakeryPageShell } from '@/design-system/bakery'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload } from 'payload'
import { RenderParams } from '@/components/RenderParams'
import { AccountNav } from '@/components/AccountNav'
import { AccountSceneryBanner } from '@/components/scenery/AccountSceneryBanner'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

const accountSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  return (
    <div className={`accountSceneryRoute ${accountSerif.variable}`}>
      <AccountSceneryBanner />

      <div className="container">
        <RenderParams className="" />
      </div>

      <BakeryPageShell as="div" className="accountSceneryShell pb-8 flex gap-8" spacing="none">
        {user && <AccountNav className="max-w-62 grow flex-col items-start gap-4 hidden md:flex" />}

        <div className="flex flex-col gap-12 grow">{children}</div>
      </BakeryPageShell>
    </div>
  )
}
