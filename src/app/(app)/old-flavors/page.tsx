import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { areBakeryTextsOffered } from '@/utilities/sms/twilioMessages'
import { FlavorNudgeProvider, NudgeCardButton } from '@/components/FlavorNudge'
import { Media } from '@/components/Media'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import {
  BakeryAction,
  BakeryPageShell,
  BakeryPageSurface,
  BakerySectionHeader,
} from '@/design-system/bakery'
import { toNudgeFlavors } from '@/features/flavor-nudges/service'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'
import { cateringMenuHref, menuHref, oldFlavorsHref } from '@/utilities/routes'

import { queryOldFlavorPosters } from '../cookiePosterQueries'
import { SceneryPageHero } from '../menu/_components/scenery-page-hero.client'
import '../menu/_components/catering-menu-hero.css'
import './old-flavors.css'

export const metadata = buildStaticMetadata({
  description:
    'The Baked with Blessings flavor hall of fame: every cookie that has rotated off the menu. Any of them can come back, and all of them can be ordered through Catering.',
  path: oldFlavorsHref,
  title: 'Old Flavors',
})

export default async function OldFlavorsPage() {
  const [initialSceneryTone, posters] = await Promise.all([
    getMenuSceneToneFromCookies(),
    queryOldFlavorPosters(),
  ])

  return (
    <div className="oldFlavorsTypography">
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <SceneryPageHero
          eyebrow="Hall of Fame"
          initialSceneryTone={initialSceneryTone}
          summary="Every flavor that has rotated off the menu. Any of them might come back, and all of them can be ordered through Catering."
          title="Old Flavors"
        />

        <BakeryPageShell as="section" bleed className="oldFlavorsBand" spacing="none" width="full">
          <BakeryPageSurface
            as="div"
            className="oldFlavorsShell container"
            spacing="none"
            tone="plain"
            width="full"
          >
            <div className="oldFlavorsIntro">
              <BakerySectionHeader
                className="oldFlavorsHeader"
                description="Flavors rotate every week. These are the ones resting for now. Miss one? Tap Bring it back so the baker knows, or order it in a Catering package."
                eyebrow={`${posters.length} ${posters.length === 1 ? 'flavor' : 'flavors'}`}
                title="The flavor hall of fame"
              />
              <div className="oldFlavorsActions">
                <BakeryAction
                  as={Link}
                  end={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
                  href={cateringMenuHref}
                  size="lg"
                  variant="primary"
                >
                  Order through Catering
                </BakeryAction>
                <BakeryAction as={Link} href={menuHref} size="lg" variant="secondary">
                  See this week’s menu
                </BakeryAction>
              </div>
            </div>

            {posters.length > 0 ? (
              <FlavorNudgeProvider
                flavors={toNudgeFlavors(posters)}
                textsOffered={areBakeryTextsOffered()}
              >
                <ul className="oldFlavorsGrid">
                  {posters.map((poster) => (
                    <li className="oldFlavorsCard" key={poster.slug}>
                      <div className="oldFlavorsCookie">
                        {poster.image ? (
                          <Media
                            fill
                            htmlElement={null}
                            imgClassName="oldFlavorsCookieImage"
                            resource={poster.image}
                            size="(max-width: 640px) 45vw, 240px"
                          />
                        ) : (
                          <Image
                            alt={`${poster.title} cookie`}
                            className="oldFlavorsCookieImage"
                            fill
                            sizes="240px"
                            src={poster.bodyFallbackSrc}
                            unoptimized
                          />
                        )}
                      </div>
                      <h2 className="oldFlavorsCardTitle cateringMenuRoundHeading">
                        {poster.title}
                      </h2>
                      {typeof poster.productId === 'number' ? (
                        <NudgeCardButton productId={poster.productId} title={poster.title} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </FlavorNudgeProvider>
            ) : (
              <p className="oldFlavorsEmpty">
                Every flavor we have made is on the menu right now. Check back after the next
                rotation.
              </p>
            )}
          </BakeryPageSurface>
        </BakeryPageShell>
      </div>
    </div>
  )
}
