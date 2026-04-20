import { redirect } from 'next/navigation'

import { rotatingCookieFlavorsHref } from '@/utilities/routes'

export default function HomePageRedirect() {
  redirect(rotatingCookieFlavorsHref)
}
