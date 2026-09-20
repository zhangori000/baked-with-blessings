import { Gutter, Link } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import { BulkCookiePriceTool } from '@/components/BeforeDashboard/BulkCookiePriceTool'
import { LocalMediaSyncCard } from '@/components/BeforeDashboard/LocalMediaSyncCard'

import { ActiveRotation } from './ActiveRotation'
import { AttentionOrders } from './AttentionOrders'
import { loadAdminDashboardData } from './data'
import { dailyDestinations, supportingDestinations } from './destinations'
import styles from './index.module.css'
import { attentionOrdersHref } from './orderQueue'

export const AdminDashboard = async ({ initPageResult }: AdminViewServerProps) => {
  const req = initPageResult?.req

  // Logged-out visitors never reach this view (the payload layout renders
  // a standalone login first). Still fail closed instead of throwing —
  // a thrown dashboard is a blank /admin.
  if (!req || !req.user) {
    redirect('/admin/login')
  }

  const dashboardData = await loadAdminDashboardData({ payload: req.payload, req })

  return (
    <Gutter className={styles.gutter}>
      <div className={styles.dashboard}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Bakery command center</p>
          <h1 className={styles.title}>What would you like to take care of?</h1>
          <p className={styles.subtitle}>
            Everyday bakery work is one click away. Cookie lineups change this week&apos;s specials.
            Cookies and menu is the standing catalog.
          </p>
          <Link className={styles.storefrontLink} href="/" prefetch={false}>
            View the storefront
          </Link>
        </header>

        <section aria-labelledby="attention-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>Needs attention</p>
              <h2 className={styles.sectionTitle} id="attention-heading">
                Your work queue
              </h2>
            </div>
            {dashboardData.attentionOrders.kind === 'ready' &&
            dashboardData.attentionOrders.totalDocs > 0 ? (
              <Link className={styles.sectionLink} href={attentionOrdersHref} prefetch={false}>
                View all {dashboardData.attentionOrders.totalDocs} open orders
              </Link>
            ) : null}
          </div>
          <div className={styles.attentionGrid}>
            <article className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>Newest first</h3>
              <p className={styles.attentionDescription}>
                New orders land at the top. Requested, confirmed, and ready-for-pickup stay here
                until you finish them.
              </p>
              <AttentionOrders state={dashboardData.attentionOrders} />
            </article>
            <article className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>This week&apos;s specials</h3>
              <p className={styles.attentionDescription}>
                The live Cookie lineup. Open it to add, remove, or reorder this week&apos;s cookies.
              </p>
              <ActiveRotation state={dashboardData.activeRotation} />
            </article>
          </div>
        </section>

        <section aria-labelledby="daily-work-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>Start here</p>
              <h2 className={styles.sectionTitle} id="daily-work-heading">
                Daily work
              </h2>
            </div>
            <p className={styles.sectionHint}>Each card goes straight to the right screen.</p>
          </div>

          <div className={styles.actionGrid}>
            {dailyDestinations.map((destination) => (
              <Link
                className={styles.actionCard}
                href={destination.href}
                key={destination.key}
                prefetch={false}
              >
                <span className={styles.actionTitle}>{destination.label}</span>
                <span className={styles.actionDescription}>{destination.description}</span>
                <span aria-hidden="true" className={styles.actionArrow}>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="more-work-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>Also useful</p>
              <h2 className={styles.sectionTitle} id="more-work-heading">
                Website and community
              </h2>
            </div>
          </div>
          <ul className={styles.supportingGrid}>
            {supportingDestinations.map((destination) => (
              <li key={destination.key}>
                <Link className={styles.supportingLink} href={destination.href} prefetch={false}>
                  <span>{destination.label}</span>
                  <span className={styles.supportingDescription}>{destination.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="admin-tools-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>Use with care</p>
              <h2 className={styles.sectionTitle} id="admin-tools-heading">
                Bulk tools
              </h2>
            </div>
            <p className={styles.sectionHint}>
              These update many records at once, so they stay separate from daily navigation.
            </p>
          </div>
          <div className={styles.toolsGrid}>
            <article className={styles.toolCard}>
              <h3 className={styles.toolTitle}>Set every cookie price</h3>
              <p className={styles.toolDescription}>
                Change individual cookie prices together. Tray and catering prices stay unchanged.
              </p>
              <BulkCookiePriceTool messageClassName={styles.helperText} />
            </article>
            <LocalMediaSyncCard />
          </div>
        </section>
      </div>
    </Gutter>
  )
}
