import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'

import { HomeCookieCarousel } from './HomeCookieCarousel.client'
import { queryPublicRotationCookiePosters } from './cookiePosterQueries'

export async function RotationsShowcase() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const posters = await queryPublicRotationCookiePosters()

  return (
    <HomeCookieCarousel
      initialSceneryTone={initialSceneryTone}
      posters={posters}
      sceneVariant="scenery"
    />
  )
}
