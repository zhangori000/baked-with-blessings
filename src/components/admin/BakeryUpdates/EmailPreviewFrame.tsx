'use client'

import React, { useCallback, useDeferredValue, useRef, useState } from 'react'

import styles from './index.module.css'

/**
 * Shows the exact email HTML that customers receive. The frame blocks scripts,
 * and it grows to the email's height so the page scrolls instead of the frame.
 */
export const EmailPreviewFrame = ({ html, title }: { html: string; title: string }) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(720)
  const deferredHTML = useDeferredValue(html)

  const fitToContent = useCallback(() => {
    const document = frameRef.current?.contentDocument

    if (document?.documentElement) {
      setHeight(document.documentElement.scrollHeight)
    }
  }, [])

  return (
    <iframe
      className={styles.emailFrame}
      onLoad={fitToContent}
      ref={frameRef}
      sandbox="allow-same-origin"
      srcDoc={deferredHTML}
      style={{ height }}
      title={title}
    />
  )
}
