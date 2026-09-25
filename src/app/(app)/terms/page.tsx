import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, LegalSection, legalPagesUpdated } from '@/components/LegalPage'
import { BAKERY_INBOX } from '@/utilities/email/contactChannels'
import { businessCity, businessState, cottageFoodDisclosure } from '@/utilities/businessInfo'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { privacyHref } from '@/utilities/routes'

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      lead="These terms cover using bakedwithblessings.com, ordering from us, and our bakery texts and emails."
      title="Terms and Conditions"
      updated={legalPagesUpdated}
    >
      <LegalSection title="Who we are">
        <p>
          Baked with Blessings is a home bakery in {businessCity}, {businessState}, run under
          Minnesota&apos;s cottage food law. {cottageFoodDisclosure}
        </p>
      </LegalSection>

      <LegalSection title="Orders">
        <p>
          Orders are for local pickup or an in-person hand-off. We do not ship. Flavors and prices
          can change. Your order confirmation shows what you ordered and what you paid.
        </p>
      </LegalSection>

      <LegalSection id="texts" title="Bakery texts">
        <p>
          <strong>Program:</strong> Baked with Blessings bakery texts tell you when we drop a new
          flavor or post a farmers market date.
        </p>
        <ul>
          <li>
            <strong>How you join:</strong> check the texts box when you create an account, or turn
            texts on from your account page. We send one text to confirm. We never text you to ask
            for permission.
          </li>
          <li>
            <strong>How often:</strong> message frequency varies.
          </li>
          <li>
            <strong>Cost:</strong> message and data rates may apply.
          </li>
          <li>
            <strong>Stop anytime:</strong> reply STOP to any bakery text. We send one text to
            confirm you are unsubscribed. Reply START to join again.
          </li>
          <li>
            <strong>Help:</strong> reply HELP, or email{' '}
            <a href={`mailto:${BAKERY_INBOX}`}>{BAKERY_INBOX}</a>.
          </li>
          <li>Carriers are not liable for delayed or undelivered messages.</li>
          <li>Consent to texts is not a condition of any purchase.</li>
        </ul>
        <p>
          One-time login codes are separate from bakery texts and still arrive if you stop bakery
          texts. See our <Link href={`${privacyHref}#texts`}>Privacy Policy</Link> for how we handle
          your phone number.
        </p>
      </LegalSection>

      <LegalSection title="Bakery emails">
        <p>
          New accounts with an email address get flavor drops and market dates by email. Every
          bakery email has an unsubscribe link, and you can turn them off from your account page.
          Order receipts and login codes still arrive.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>Keep your password private. We may remove posts that are abusive or spam.</p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          If these terms change, we will update the date at the top of this page. Questions? Email{' '}
          <a href={`mailto:${BAKERY_INBOX}`}>{BAKERY_INBOX}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}

export const metadata: Metadata = {
  description: 'Terms for ordering from Baked with Blessings and for bakery texts and emails.',
  openGraph: mergeOpenGraph({
    title: 'Terms and Conditions',
    url: '/terms',
  }),
  title: 'Terms and Conditions',
}
