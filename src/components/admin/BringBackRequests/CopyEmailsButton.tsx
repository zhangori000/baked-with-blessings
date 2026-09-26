'use client'

import { Button } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const COPIED_FEEDBACK_MS = 2000

export function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <Button
      buttonStyle="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(emails.join(', '))
          setCopied(true)
        } catch {
          setCopied(false)
        }
      }}
      size="small"
    >
      {copied ? 'Copied!' : 'Copy emails'}
    </Button>
  )
}
