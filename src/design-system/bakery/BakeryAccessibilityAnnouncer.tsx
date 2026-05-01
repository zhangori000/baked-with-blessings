'use client'

import React, { forwardRef, memo } from 'react'

type BakeryAccessibilityAnnouncerProps = {
  announcementKey?: number
  message?: null | string
  politeness?: React.AriaAttributes['aria-live']
}

const displayMessageMs = 500

export const BakeryAccessibilityAnnouncer = memo(
  forwardRef<HTMLParagraphElement, BakeryAccessibilityAnnouncerProps>(
    ({ announcementKey, message, politeness = 'polite' }, ref) => (
      <div aria-atomic aria-live={politeness} className="bakeryAccessibilityAnnouncer">
        {message ? (
          <p key={announcementKey} ref={ref}>
            {message}
          </p>
        ) : null}
      </div>
    ),
  ),
)

BakeryAccessibilityAnnouncer.displayName = 'BakeryAccessibilityAnnouncer'

export const bakeryAnnouncementDisplayMessageMs = displayMessageMs
