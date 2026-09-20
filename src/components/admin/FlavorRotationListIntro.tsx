import { Link } from '@payloadcms/ui'
import React from 'react'

import { cookiesAndMenuListPath } from '@/utilities/bakerMenuAdmin'

import { AdminCollectionIntro } from './AdminCollectionIntro'

export const FlavorRotationListIntro = () => (
  <AdminCollectionIntro>
    <p>
      This is this week&apos;s specials. Open the live lineup, then choose the cookies customers see
      on Specials of the Week.
    </p>
    <p>
      To change a cookie&apos;s price or photo, or to keep something on the menu year-round, use{' '}
      <Link href={cookiesAndMenuListPath} prefetch={false}>
        Cookies and menu
      </Link>
      .
    </p>
  </AdminCollectionIntro>
)
