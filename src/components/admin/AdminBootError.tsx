'use client'

import React from 'react'

import { explainAdminError } from '@/utilities/adminErrorCopy'

export const AdminBootError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) => {
  const message = error.message || 'Unknown admin error'

  return (
    <main
      style={{
        boxSizing: 'border-box',
        color: 'var(--theme-elevation-800, #d5d5d5)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
        margin: '0 auto',
        maxWidth: '40rem',
        padding: '3rem 1.5rem',
      }}
    >
      <p
        style={{
          color: 'var(--theme-success-700, #7ea87e)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Admin preview
      </p>
      <h1 style={{ fontSize: '1.75rem', lineHeight: 1.2, margin: '0.4rem 0 0.8rem' }}>
        The admin panel could not load
      </h1>
      <p style={{ lineHeight: 1.55, margin: '0 0 1rem' }}>{explainAdminError(message)}</p>
      <pre
        style={{
          background: 'var(--theme-elevation-50, #1b1b1b)',
          borderRadius: '0.6rem',
          fontSize: '0.85rem',
          lineHeight: 1.45,
          overflow: 'auto',
          padding: '0.9rem 1rem',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message}
      </pre>
      {reset ? (
        <button
          onClick={() => reset()}
          style={{
            background: 'var(--theme-elevation-100, #2a2a2a)',
            border: '1px solid var(--theme-elevation-250, #444)',
            borderRadius: '999px',
            color: 'inherit',
            cursor: 'pointer',
            fontWeight: 600,
            marginTop: '1.25rem',
            minHeight: '44px',
            padding: '0.65rem 1rem',
          }}
          type="button"
        >
          Try again
        </button>
      ) : null}
    </main>
  )
}
