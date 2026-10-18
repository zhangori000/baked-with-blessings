'use client'

import React, { useState } from 'react'

const fieldStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #c9b79a',
  borderRadius: '0.55rem',
  boxSizing: 'border-box',
  display: 'block',
  font: 'inherit',
  marginTop: '0.35rem',
  minHeight: '44px',
  padding: '0.55rem 0.75rem',
  width: '100%',
}

export const AdminLoginForm = () => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
      .trim()
      .toLowerCase()
    const password = String(form.get('password') || '')

    try {
      const response = await fetch('/api/admins/login', {
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        setError('That email and password did not match an admin account for this environment.')
        return
      }

      window.location.assign('/admin')
    } catch {
      setError(
        'Could not reach the admin login service. This preview needs its own PAYLOAD_SECRET and database. Do not point preview at production.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        htmlFor="field-email"
        style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}
      >
        Email
        <input
          autoComplete="username"
          id="field-email"
          name="email"
          required
          style={fieldStyle}
          type="email"
        />
      </label>
      <label
        htmlFor="field-password"
        style={{ display: 'block', fontWeight: 600, marginBottom: '1.25rem' }}
      >
        Password
        <input
          autoComplete="current-password"
          id="field-password"
          name="password"
          required
          style={fieldStyle}
          type="password"
        />
      </label>
      {error ? (
        <p role="alert" style={{ color: '#7a2100', lineHeight: 1.45, margin: '0 0 1rem' }}>
          {error}
        </p>
      ) : null}
      <button
        disabled={isSubmitting}
        style={{
          background: '#4b3b24',
          border: 0,
          borderRadius: '999px',
          color: '#fffaf0',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 700,
          minHeight: '44px',
          padding: '0.65rem 1.15rem',
        }}
        type="submit"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
