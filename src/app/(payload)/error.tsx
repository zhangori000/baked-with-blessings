'use client'

import React from 'react'

import { AdminBootError } from '@/components/admin/AdminBootError'

export default function PayloadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AdminBootError error={error} reset={reset} />
}
