'use client'

import React from 'react'

import { explainAdminError } from '@/utilities/adminErrorCopy'

const pageStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  margin: '0 auto',
  maxWidth: '40rem',
  padding: '3rem 1.5rem',
}

export const AdminBootError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) => {
  const message = error.message || 'Unknown admin error'

  return (
    <main data-admin-shell="error" style={pageStyle}>
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          margin: 0,
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
          background: '#fff8e6',
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
            background: '#4b3b24',
            border: 0,
            borderRadius: '999px',
            color: '#fffaf0',
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
