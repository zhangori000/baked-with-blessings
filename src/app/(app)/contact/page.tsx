import type { Metadata } from 'next'

import { BakeryPageShell, BakeryPageSurface, BakerySectionHeader } from '@/design-system/bakery'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { Cormorant_Garamond } from 'next/font/google'

import { ContactEnvelopeForm } from './ContactEnvelopeForm.client'
import { ContactSceneryHero } from './ContactSceneryHero.client'
import '../menu/_components/catering-menu-hero.css'
import './contact.css'

const contactSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  description:
    'Contact Baked with Blessings for custom orders, pickup questions, event notes, and bakery messages.',
  title: 'Contact',
}

export default async function ContactPage() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()

  return (
    <div className={`contactTypography ${contactSerif.variable}`}>
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <ContactSceneryHero initialSceneryTone={initialSceneryTone} />

        <BakeryPageShell
          as="section"
          bleed
          className="contactContentBand"
          spacing="none"
          width="full"
        >
          <BakeryPageSurface
            as="div"
            className="contactContentShell container"
            spacing="none"
            tone="plain"
            width="full"
          >
            <BakerySectionHeader
              className="contactSectionHeader"
              description="Questions, pickup details, custom order ideas, and event notes can all go here."
              eyebrow="Direct message"
              title="Send a bakery note"
            />

            <ContactEnvelopeForm initialSceneryTone={initialSceneryTone} />
          </BakeryPageSurface>
        </BakeryPageShell>
      </div>
    </div>
  )
}
