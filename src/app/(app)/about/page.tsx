import type { Metadata } from 'next'

import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { BakeryAction } from '@/design-system/bakery'
import {
  businessCity,
  businessState,
  businessStateFull,
  cottageFoodDisclosure,
  serviceAreaCities,
  serviceAreaShort,
  socialProfiles,
} from '@/utilities/businessInfo'
import { contactHref, menuHref } from '@/utilities/routes'
import { getServerSideURL } from '@/utilities/getURL'
import { siteName } from '@/utilities/siteMetadata'
import { MessageCircle, ShoppingBag } from 'lucide-react'
import { Cormorant_Garamond } from 'next/font/google'
import Link from 'next/link'

import { AboutComic } from './AboutComic'
import { AboutSceneryHero } from './AboutSceneryHero.client'
import '../menu/_components/catering-menu-hero.css'
import './about.css'

const aboutSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-about-serif',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  description: `${siteName} is a home-based cookie bakery in ${businessCity}, ${businessState}. You order, we bake a small batch, and we meet up for a local pickup or hand-off.`,
  title: 'About & how it works',
}

export default async function AboutPage() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const siteURL = getServerSideURL()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: siteName,
    description: `Home-based bakery offering small-batch cookies and bundles for local pickup and meetup hand-off across ${serviceAreaShort}.`,
    url: `${siteURL}/about`,
    image: `${siteURL}/baked-with-blessings-social.png`,
    servesCuisine: 'Bakery',
    address: {
      '@type': 'PostalAddress',
      addressLocality: businessCity,
      addressRegion: businessState,
      addressCountry: 'US',
    },
    areaServed: [
      ...serviceAreaCities.map((city) => ({
        '@type': 'City',
        name: city,
        containedInPlace: { '@type': 'State', name: businessStateFull },
      })),
      { '@type': 'AdministrativeArea', name: 'West Twin Cities metro' },
    ],
    sameAs: [socialProfiles.instagram, socialProfiles.tiktok],
  }

  return (
    <div className={`aboutTypography ${aboutSerif.variable}`}>
      <script
        type="application/ld+json"
        // Structured data for local SEO — service-area business, no street address.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <AboutSceneryHero initialSceneryTone={initialSceneryTone} />

        <section className="aboutContent">
          <div className="container aboutContentInner">
            <div className="aboutHook">
              <h2 className="aboutHookLead">
                Ever get one of those random cravings for a sweet treat?
              </h2>
              <p className="aboutHookSub">
                Same. Here&apos;s how we fix it — homemade from scratch with real ingredients (no
                preservatives, no factory shortcuts), straight from our kitchen to your hands.
              </p>
            </div>
            <AboutComic />

            <div className="aboutGist">
              <div className="aboutGistCopy">
                <h2 className="aboutHeading">We&apos;re just getting started</h2>
                <p>A real home kitchen — small batches, real ingredients, baked the day they go out.</p>
                <p>
                  We&apos;re figuring it out as we grow, with farmers markets and pop-ups on the way.
                  Thanks for being early.
                </p>
              </div>
              <ul className="aboutFacts" aria-label="The basics">
                <li>Homemade from scratch — real ingredients</li>
                <li>Home kitchen in {businessCity}, {businessState}</li>
                <li>Pickup &amp; meetup — no shipping</li>
                <li>Last-minute or planned ahead — we&apos;re flexible</li>
              </ul>
            </div>

            <div className="aboutWhere">
              <p className="aboutWhereLabel">Easy to meet around</p>
              <ul className="aboutChips" aria-label="Hand-off areas">
                {serviceAreaCities.map((city) => (
                  <li key={city}>{city}</li>
                ))}
              </ul>
            </div>

            <p className="aboutFinePrint">
              Baked in a home kitchen that also handles wheat, eggs, dairy, nuts &amp; soy — please
              tell us about allergies. {cottageFoodDisclosure}
            </p>
          </div>
        </section>

        <section className="aboutCta">
          <div className="container aboutCtaInner">
            <h2 className="aboutCtaTitle">Hungry yet?</h2>
            <p className="aboutCtaSub">Go pick out some cookies — we&apos;ll handle the rest.</p>
            <div className="aboutActions">
              <BakeryAction as={Link} href={menuHref} size="lg" variant="primary">
                <ShoppingBag className="h-4 w-4" />
                <span>See the menu</span>
              </BakeryAction>
              <BakeryAction
                as={Link}
                end={<MessageCircle className="h-4 w-4" />}
                href={contactHref}
                size="lg"
                variant="secondary"
              >
                Say hi
              </BakeryAction>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
