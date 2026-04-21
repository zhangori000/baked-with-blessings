import { HomeCookieCarousel } from '../HomeCookieCarousel.client'
import { queryHomeCookiePosters } from '../cookiePosterQueries'

export const metadata = {
  description: 'Browse the rotating cookie flavors in the animated sheep showcase.',
  title: 'Rotating Cookie Flavors',
}

export default async function RotatingCookieFlavorsPage() {
  const posters = await queryHomeCookiePosters()

  return <HomeCookieCarousel posters={posters} sceneVariant="scenery" />
}
