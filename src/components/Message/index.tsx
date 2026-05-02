'use client'

import { X } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

/* [
          classes.message,
          className,
          error && classes.error,
          success && classes.success,
          warning && classes.warning,
          !error && !success && !warning && classes.default,
        ]
          .filter(Boolean)
          .join(' '), */

export const Message: React.FC<{
  className?: string
  dismissLabel?: string
  error?: React.ReactNode
  message?: React.ReactNode
  onDismiss?: () => void
  success?: React.ReactNode
  warning?: React.ReactNode
}> = ({
  className,
  dismissLabel = 'Dismiss message',
  error,
  message,
  onDismiss,
  success,
  warning,
}) => {
  const messageToRender = message || error || success || warning

  if (messageToRender) {
    return (
      <div
        className={cn(
          'my-8 flex items-start gap-3 rounded-lg p-4',
          {
            'bg-success': Boolean(success),
            'bg-warning': Boolean(warning),
            'border border-[#efb6a8] bg-[#fff2ee] text-[#7a271c] shadow-[0_8px_24px_rgba(122,39,28,0.08)] dark:border-[#8d3d33] dark:bg-[#3a1713] dark:text-[#ffd8cf]':
              Boolean(error),
          },
          className,
        )}
        role={error ? 'alert' : 'status'}
      >
        <div className="min-w-0 flex-1">{messageToRender}</div>
        {onDismiss ? (
          <button
            aria-label={dismissLabel}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/15 text-current/75 transition hover:bg-white/25 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25"
            onClick={onDismiss}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    )
  }
  return null
}
