import React from 'react'

import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

const isPreviewDeployment = () => process.env.VERCEL_ENV === 'preview'

export const AdminLoginPage = () => {
  const preview = isPreviewDeployment()

  return (
    <main
      data-admin-shell="login"
      style={{
        boxSizing: 'border-box',
        margin: '0 auto',
        maxWidth: '28rem',
        padding: '3rem 1.5rem',
      }}
    >
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          margin: 0,
          textTransform: 'uppercase',
        }}
      >
        {preview ? 'Preview admin' : 'Private workspace'}
      </p>
      <h1 style={{ fontSize: '1.85rem', lineHeight: 1.2, margin: '0.4rem 0 0.75rem' }}>
        Sign in to the bakery admin
      </h1>
      <p style={{ lineHeight: 1.55, margin: '0 0 1.5rem' }}>
        {preview
          ? 'This is a Vercel preview, not the live site. Use a preview admin account. Production login still lives at bakedwithblessings.com/admin.'
          : 'Sign in with an authorized bakery account to continue.'}
      </p>
      <AdminLoginForm />
      <p style={{ lineHeight: 1.5, marginTop: '1.75rem', opacity: 0.78 }}>
        After you sign in, the usual Payload dashboard opens. If sign-in fails, this preview needs
        its own admin user and database — not the production ones.
      </p>
    </main>
  )
}
