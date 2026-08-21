import React from 'react'

import { AdminCollectionIntro } from './AdminCollectionIntro'

export const ProductListIntro = () => (
  <AdminCollectionIntro kicker="Standing menu" title="Cookies, trays, and prices">
    <p>
      Edit photos, prices, and the always-available menu here. The{' '}
      <strong>Where it lives</strong> column shows whether a cookie is on this week&apos;s lineup,
      on the standing menu, or catering-only.
    </p>
    <p>
      To change Specials of the Week for everyone at once, open <strong>Cookie lineups</strong>.
      Changing one cookie to &quot;In the current rotation&quot; also adds it to that lineup.
    </p>
  </AdminCollectionIntro>
)
