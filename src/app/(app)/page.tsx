import { redirect } from 'next/navigation'

import { rotationsHref } from '@/utilities/routes'

export default function HomePageRedirect() {
  redirect(rotationsHref)
}
