'use client'

import Link from 'next/link'
import React, { Fragment, useCallback, useState, MouseEvent } from 'react'
import { toast } from '@payloadcms/ui'

import styles from './index.module.css'

const SuccessMessage: React.FC = () => (
  <div>
    Database seeded! You can now{' '}
    <Link href="/">
      visit your website
    </Link>
  </div>
)

type SeedButtonProps = {
  className?: string
  messageClassName?: string
}

export const SeedButton: React.FC<SeedButtonProps> = ({ className, messageClassName }) => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (seeded) {
        toast.info('Database already seeded.')
        return
      }
      if (loading) {
        toast.info('Seeding already in progress.')
        return
      }
      if (error) {
        toast.error(error)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/next/seed', { method: 'POST', credentials: 'include' })
        const contentType = res.headers.get('content-type') || ''
        const body = contentType.includes('application/json') ? await res.json() : await res.text()

        if (!res.ok) {
          const message =
            typeof body === 'string'
              ? body
              : body?.error || 'An error occurred while seeding the database.'

          setError(message)
          toast.error(message)
          return
        }

        setSeeded(true)
        toast.success(<SuccessMessage />)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred while seeding.'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [loading, seeded, error],
  )

  let message = ''
  if (loading) message = ' (seeding...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button
        className={[styles.button, className].filter(Boolean).join(' ')}
        disabled={loading}
        onClick={handleClick}
        type="button"
      >
        Seed your database
      </button>
      {message ? (
        <span className={[styles.message, messageClassName].filter(Boolean).join(' ')}>
          {message}
        </span>
      ) : null}
    </Fragment>
  )
}
