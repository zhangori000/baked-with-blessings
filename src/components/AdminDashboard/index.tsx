import { Gutter, Link } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import { BulkCookiePriceTool } from '@/components/BeforeDashboard/BulkCookiePriceTool'
import { LocalMediaSyncCard } from '@/components/BeforeDashboard/LocalMediaSyncCard'

import type { ActiveRotationState, AttentionOrder, AttentionOrdersState } from './data'
import { loadAdminDashboardData } from './data'
import { dailyDestinations, supportingDestinations } from './destinations'
import styles from './index.module.css'

const orderStatusLabels: Record<AttentionOrder['status'], string> = {
  confirmed: 'Confirmed',
  processing: 'Requested',
  ready: 'Ready for pickup',
}

const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))

const formatOrderAmount = (value: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value / 100)
    : 'Total unavailable'

const AttentionOrders = ({ state }: { state: AttentionOrdersState }) => {
  if (state.kind === 'unavailable') {
    return (
      <div className={styles.emptyState}>
        <p>Order preview is temporarily unavailable.</p>
        <Link href="/admin/collections/orders" prefetch={false}>
          Open all orders
        </Link>
      </div>
    )
  }

  if (state.docs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>You&apos;re all caught up. No orders need attention.</p>
        <Link href="/admin/collections/orders" prefetch={false}>
          View order history
        </Link>
      </div>
    )
  }

  return (
    <ul className={styles.orderList}>
      {state.docs.map((order) => (
        <li key={order.id}>
          <Link
            className={styles.orderLink}
            href={`/admin/collections/orders/${order.id}`}
            prefetch={false}
          >
            <span className={styles.orderMain}>
              <strong>{order.customerName || `Order #${order.id}`}</strong>
              <span>
                {formatOrderDate(order.createdAt)} · {formatOrderAmount(order.amount)}
              </span>
            </span>
            <span className={styles.statusPill}>{orderStatusLabels[order.status]}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const ActiveRotation = ({ state }: { state: ActiveRotationState }) => {
  if (state.kind === 'active') {
    return (
      <Link
        className={styles.rotationLink}
        href={`/admin/collections/flavor-rotations/${state.rotation.id}`}
        prefetch={false}
      >
        <span className={styles.rotationStatus}>Active now</span>
        <strong>{state.rotation.title}</strong>
        <span>Open this lineup →</span>
      </Link>
    )
  }

  const message =
    state.kind === 'none'
      ? 'No cookie lineup is active.'
      : state.kind === 'multiple'
        ? `${state.totalDocs} lineups are active. Choose just one.`
        : 'Lineup status is temporarily unavailable.'

  return (
    <div className={styles.rotationFallback}>
      <p>{message}</p>
      <Link href="/admin/collections/flavor-rotations" prefetch={false}>
        Open cookie lineups
      </Link>
    </div>
  )
}

export const AdminDashboard = async ({ initPageResult }: AdminViewServerProps) => {
  const { req } = initPageResult

  if (!req.user) {
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
            Your everyday work is one click away. The full Payload menu is still available for less
            common changes.
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
            {dashboardData.attentionOrders.kind === 'ready' ? (
              <Link
                className={styles.sectionLink}
                href="/admin/collections/orders"
                prefetch={false}
              >
                View all {dashboardData.attentionOrders.totalDocs} open orders
              </Link>
            ) : null}
          </div>
          <div className={styles.attentionGrid}>
            <article className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>Oldest orders first</h3>
              <p className={styles.attentionDescription}>
                Requested, confirmed, and ready-for-pickup orders stay here until completed.
              </p>
              <AttentionOrders state={dashboardData.attentionOrders} />
            </article>
            <article className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>Current cookie lineup</h3>
              <p className={styles.attentionDescription}>
                Check which rotating flavors customers can order right now.
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
