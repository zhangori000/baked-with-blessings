'use client'

import React, { useCallback, useState } from 'react'

import type { ReviewStatus } from '@/features/reviews/types'
import { Button, toast, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'

type SelectFieldState<T> = {
  value?: T
}

export const ReviewModerationActions: React.FC = () => {
  const { id } = useDocumentInfo()
  const reviewID = typeof id === 'number' ? id.toString() : typeof id === 'string' ? id : null

  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const currentStatus = useFormFields<ReviewStatus | null>(([fields]) => {
    const statusField = fields.publicStatus as SelectFieldState<ReviewStatus> | undefined

    if (typeof statusField !== 'object' || statusField === null) {
      return null
    }

    return statusField.value ?? null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateStatus = useCallback(
    async (nextStatus: ReviewStatus) => {
      if (!reviewID || isSubmitting) return

      setIsSubmitting(true)

      try {
        const response = await fetch(`${api}/reviews/${encodeURIComponent(reviewID)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicStatus: nextStatus }),
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Unable to update review status.')
        }

        toast.success(
          nextStatus === 'published'
            ? 'Review published. It is visible on the public reviews page.'
            : 'Review unpublished.',
        )
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to update review status.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [api, isSubmitting, reviewID],
  )

  if (!reviewID || currentStatus === null) {
    return null
  }

  return (
    <div>
      <h3>Review moderation</h3>
      <p>Use one click to set visibility for the public reviews section.</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          marginTop: '0.5rem',
        }}
      >
        <Button
          buttonStyle={currentStatus === 'published' ? 'secondary' : 'primary'}
          disabled={isSubmitting || currentStatus === 'published'}
          onClick={() => {
            void updateStatus('published')
          }}
          size="small"
          type="button"
        >
          Publish
        </Button>
        <Button
          buttonStyle={currentStatus === 'declined' ? 'secondary' : 'secondary'}
          disabled={isSubmitting || currentStatus === 'declined'}
          onClick={() => {
            void updateStatus('declined')
          }}
          size="small"
          type="button"
        >
          Unpublish
        </Button>
      </div>
      <p style={{ marginTop: '0.5rem', opacity: 0.75, fontSize: '0.875rem' }}>
        Current status: <strong>{currentStatus}</strong>
      </p>
    </div>
  )
}
