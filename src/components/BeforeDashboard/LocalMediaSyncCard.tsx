import { headers } from 'next/headers'
import React from 'react'

import { MediaSyncTool } from './MediaSyncTool'
import styles from './index.module.css'

const localhostNames = new Set(['localhost', '127.0.0.1', '::1'])

const getHostname = (host: string | null) => {
  if (!host) {
    return ''
  }

  try {
    return new URL(`http://${host}`).hostname.replace(/^\[/, '').replace(/\]$/, '')
  } catch {
    return host.replace(/^\[/, '').replace(/\]$/, '').split(':')[0] ?? ''
  }
}

const isLocalHost = (host: string | null) => localhostNames.has(getHostname(host))

export const LocalMediaSyncCard = async () => {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')

  if (!isLocalHost(host)) {
    return null
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardKicker}>Local media</span>
        <span className={styles.cardIcon}>L</span>
      </div>
      <h2 className={styles.cardTitle}>Match local media to production</h2>
      <p className={styles.cardBody}>
        Pull production Media records into localhost after uploading files on the live site.
      </p>
      <div className={styles.cardFooter}>
        <MediaSyncTool messageClassName={styles.helperText} />
      </div>
    </article>
  )
}
