import { Link } from '@payloadcms/ui'
import React from 'react'

import { cookieLineupListPath } from '@/utilities/bakerMenuAdmin'

import { AdminCollectionIntro } from './AdminCollectionIntro'

export const ProductListIntro = () => (
  <AdminCollectionIntro>
    <p>
      This is the standing catalog. Open a cookie to change where it lives, its price, and its
      photos. Always-available cookies stay on the Menu year-round.
    </p>
    <p>
      To pick this week&apos;s specials, use{' '}
      <Link href={cookieLineupListPath} prefetch={false}>
        Cookie lineups
      </Link>
      .
    </p>
  </AdminCollectionIntro>
)
