import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'

import { HomeCookieCarousel } from '../HomeCookieCarousel.client'
import { queryHomeCookiePosters } from '../cookiePosterQueries'

export const metadata = buildStaticMetadata({
  description: 'Browse the rotating cookie flavors in the animated Baked with Blessings showcase.',
  path: '/rotating-cookie-flavors',
  title: 'Rotating Cookie Flavors',
})

export default async function RotatingCookieFlavorsPage() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const posters = await queryHomeCookiePosters()

  return (
    <HomeCookieCarousel
      initialSceneryTone={initialSceneryTone}
      posters={posters}
      sceneVariant="scenery"
    />
  )
}
