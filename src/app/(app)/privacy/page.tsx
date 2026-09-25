import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, LegalSection, legalPagesUpdated } from '@/components/LegalPage'
import { BAKERY_INBOX } from '@/utilities/email/contactChannels'
import { businessCity, businessState } from '@/utilities/businessInfo'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { termsHref } from '@/utilities/routes'

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      lead={`Baked with Blessings is a small home bakery in ${businessCity}, ${businessState}. This page explains what we collect when you use this website, why, and the choices you have.`}
      title="Privacy Policy"
      updated={legalPagesUpdated}
    >
      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, phone number, and a
            password. Passwords are stored scrambled, so we cannot read them.
          </li>
          <li>
            <strong>Orders:</strong> what you ordered, pickup or hand-off details, notes you add,
            and whether the order is paid.
          </li>
          <li>
            <strong>Things you send us:</strong> contact form messages, reviews, discussion posts,
            and feature ideas.
          </li>
          <li>
            <strong>Message choices:</strong> whether you said yes to bakery texts or emails, when,
            and how (for example a checkbox, your account page, or a text reply).
          </li>
        </ul>
        <p>Card payments are handled by Stripe. We never see or store your full card number.</p>
      </LegalSection>

      <LegalSection title="How we use it">
        <ul>
          <li>To take, bake, and hand off your orders, and to send order receipts.</li>
          <li>To send one-time login and verification codes.</li>
          <li>To answer your questions.</li>
          <li>
            To send flavor drops and market dates, only if you said yes to bakery texts or bakery
            emails.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection id="texts" title="Text messages">
        <p>
          <strong>
            No mobile information will be shared with third parties or affiliates for marketing or
            promotional purposes.
          </strong>{' '}
          Text messaging opt-in data and consent are never shared with any third parties.
        </p>
        <p>
          If you say yes to bakery texts, we text you when we drop a flavor or post a market date.
          Message frequency varies. Message and data rates may apply. Reply HELP for help or STOP to
          cancel at any time. You can also turn texts off on your account page. The full text terms
          are in our <Link href={`${termsHref}#texts`}>Terms</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Who helps us run the site">
        <p>
          We share only what is needed with companies that run parts of the site for us: Vercel
          (hosting), Neon (database), Stripe (payments), Resend (email), and Twilio (text messages
          and login codes). They may use it only to provide their service to us.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use cookies and browser storage to keep you logged in, remember your cart, and remember
          your theme. We do not use advertising trackers.
        </p>
      </LegalSection>

      <LegalSection title="Public posts">
        <p>
          Reviews and discussion posts you publish can be seen by anyone who visits the site. Please
          do not include private details in them.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul>
          <li>Turn bakery texts or emails on or off anytime on your account page.</li>
          <li>Reply STOP to any bakery text, or use the unsubscribe link in any bakery email.</li>
          <li>Email us to see, correct, or delete your information, or to close your account.</li>
        </ul>
        <p>Turning off bakery texts or emails does not stop order receipts or login codes.</p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          This website is not meant for children under 13, and we do not knowingly collect their
          information.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          If this policy changes, we will update the date at the top of this page. Questions? Email{' '}
          <a href={`mailto:${BAKERY_INBOX}`}>{BAKERY_INBOX}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}

export const metadata: Metadata = {
  description: 'How Baked with Blessings collects, uses, and protects your information.',
  openGraph: mergeOpenGraph({
    title: 'Privacy Policy',
    url: '/privacy',
  }),
  title: 'Privacy Policy',
}
