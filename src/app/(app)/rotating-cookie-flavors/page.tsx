import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'

import { HomeCookieCarousel } from '../HomeCookieCarousel.client'
import { queryHomeCookiePosters } from '../cookiePosterQueries'

export const metadata = {
  description: 'Browse the rotating cookie flavors in the animated sheep showcase.',
  title: 'Rotating Cookie Flavors',
}

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
