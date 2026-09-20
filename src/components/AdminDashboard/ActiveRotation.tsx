import { Link } from '@payloadcms/ui'

import type { ActiveRotationState } from './data'
import styles from './index.module.css'

export const ActiveRotation = ({ state }: { state: ActiveRotationState }) => {
  if (state.kind === 'active') {
    return (
      <Link
        className={styles.rotationLink}
        href={`/admin/collections/flavor-rotations/${state.rotation.id}`}
        prefetch={false}
      >
        <span className={styles.rotationStatus}>Live now</span>
        <strong>{state.rotation.title}</strong>
        {state.rotation.flavors.length > 0 ? (
          <span className={styles.rotationFlavors}>{state.rotation.flavors.join(', ')}</span>
        ) : null}
        <span>Change this week&apos;s cookies →</span>
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
