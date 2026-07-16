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
