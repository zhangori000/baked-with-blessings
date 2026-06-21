import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'

import { HomeCookieCarousel } from '../HomeCookieCarousel.client'
import { queryPublicRotationCookiePosters } from '../cookiePosterQueries'

export const metadata = buildStaticMetadata({
  description: 'Browse this week’s specials in the animated Baked with Blessings showcase.',
  path: '/rotations',
  title: 'Specials of the Week',
})

export default async function RotationsPage() {
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
