import { Link } from '@payloadcms/ui'
import React from 'react'

import { quickNavDestinations } from './destinations'
import styles from './AdminQuickNav.module.css'

export const AdminQuickNav = () => (
  <section className={styles.section} aria-labelledby="daily-work-nav-heading">
    <h2 className={styles.heading} id="daily-work-nav-heading">
      Daily work
    </h2>
    <ul className={styles.list}>
      {quickNavDestinations.map((destination) => (
        <li key={destination.key}>
          <Link className={styles.link} href={destination.href} prefetch={false}>
            {destination.label}
          </Link>
        </li>
      ))}
    </ul>
  </section>
)
