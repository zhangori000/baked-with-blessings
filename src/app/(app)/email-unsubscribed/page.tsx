import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { BakeryPageLead, BakeryPageSurface, BakeryPageTitle } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function EmailUnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ invalid?: string }>
}) {
  const params = await searchParams
  const invalid = params.invalid === '1'

  return (
    <BakeryPageSurface className="accountSettingsCard" spacing="lg" width="narrow">
      <p className="accountSettingsEyebrow">Bakery emails</p>
      <BakeryPageTitle className="accountSettingsTitle">
        {invalid ? 'That link is not valid' : 'Bakery emails are off'}
      </BakeryPageTitle>
      <BakeryPageLead className="accountSettingsLead">
        {invalid
          ? 'The unsubscribe link is missing or expired. You can still turn bakery emails off from your account.'
          : 'You unsubscribed from flavor drops, market dates, and announcements. Order receipts and login codes still arrive. You can turn bakery emails back on from your account.'}
      </BakeryPageLead>
      <Button asChild variant="default">
        <Link href="/account">Account settings</Link>
      </Button>
    </BakeryPageSurface>
  )
}

export const metadata: Metadata = {
  description: 'Bakery email notification settings.',
  openGraph: mergeOpenGraph({
    title: 'Bakery emails',
    url: '/email-unsubscribed',
  }),
  title: 'Bakery emails',
}
