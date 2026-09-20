import { Link } from '@payloadcms/ui'

import { businessTimeZone } from '@/utilities/businessInfo'

import type { AttentionOrder, AttentionOrdersState } from './data'
import styles from './index.module.css'

const orderStatusLabels: Record<AttentionOrder['status'], string> = {
  confirmed: 'Confirmed',
  processing: 'Requested',
  ready: 'Ready for pickup',
}

const orderStatusClassNames: Record<AttentionOrder['status'], string> = {
  confirmed: styles.statusPillConfirmed,
  processing: styles.statusPillProcessing,
  ready: styles.statusPillReady,
}

const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: businessTimeZone,
  }).format(new Date(value))

const formatOrderAmount = (value: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value / 100)
    : 'Total unavailable'

export const AttentionOrders = ({ state }: { state: AttentionOrdersState }) => {
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
              <strong>{order.primaryCustomer}</strong>
              {order.secondaryCustomer ? (
                <span className={styles.orderSecondary}>{order.secondaryCustomer}</span>
              ) : null}
              <span className={styles.orderItems}>{order.itemsSummary}</span>
              <span>
                {order.paymentLabel} ·{' '}
                <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time> ·{' '}
                {formatOrderAmount(order.amount)}
              </span>
            </span>
            <span className={`${styles.statusPill} ${orderStatusClassNames[order.status]}`}>
              {orderStatusLabels[order.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
