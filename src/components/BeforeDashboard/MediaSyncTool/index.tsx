'use client'

import React, { useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import { BakeryPressable } from '@/design-system/bakery'

import styles from './index.module.css'

type MediaSyncToolProps = {
  messageClassName?: string
}

type MediaSyncResponse = {
  created?: number
  deleted?: number
  error?: string
  skipped?: number
  sourceCount?: number
  success?: boolean
  updated?: number
}

const formatSyncMessage = ({
  created = 0,
  deleted = 0,
  skipped = 0,
  sourceCount = 0,
  updated = 0,
}: MediaSyncResponse) =>
  `Synced ${sourceCount} production media records. Created ${created}, updated ${updated}, deleted ${deleted}, skipped ${skipped}.`

export const MediaSyncTool: React.FC<MediaSyncToolProps> = ({ messageClassName }) => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keepLocalMissing, setKeepLocalMissing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSync = useCallback(async () => {
    if (isSubmitting) {
      toast.info('Media sync already in progress.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      const response = await fetch('/next/admin-media-sync', {
        body: JSON.stringify({ keepLocalMissing }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const contentType = response.headers.get('content-type') || ''
      const body = contentType.includes('application/json')
        ? ((await response.json()) as MediaSyncResponse)
        : await response.text()

      if (!response.ok) {
        const message =
          typeof body === 'string'
            ? body
            : body.error || 'An error occurred while syncing media from production.'

        setError(message)
        toast.error(message)
        return
      }

      const message = typeof body === 'string' ? 'Production media synced.' : formatSyncMessage(body)

      setSuccessMessage(message)
      toast.success(message)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while syncing media.'

      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, keepLocalMissing])

  const statusMessage =
    error ||
    successMessage ||
    'Copies production Media records into your local database. Files stay in Vercel Blob.'

  return (
    <div className={styles.actions}>
      <BakeryPressable
        className={styles.button}
        disabled={isSubmitting}
        onClick={handleSync}
        type="button"
      >
        {isSubmitting ? 'Syncing...' : 'Sync media from production'}
      </BakeryPressable>
      <label className={styles.option}>
        <input
          checked={keepLocalMissing}
          className={styles.checkbox}
          disabled={isSubmitting}
          onChange={(event) => setKeepLocalMissing(event.target.checked)}
          type="checkbox"
        />
        Keep local-only media records
      </label>
      <p
        className={[
          styles.message,
          error ? styles.error : null,
          successMessage ? styles.success : null,
          messageClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {statusMessage}
      </p>
    </div>
  )
}
