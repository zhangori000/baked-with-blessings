'use client'

import React, { useDeferredValue, useEffect, useRef, useState } from 'react'

import styles from './index.module.css'

/**
 * Shows the exact email HTML that customers receive. The frame blocks scripts,
 * and it grows to the email's height so the page scrolls instead of the frame.
 */
export const EmailPreviewFrame = ({ html, title }: { html: string; title: string }) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(720)
  const deferredHTML = useDeferredValue(html)

  // A server-rendered frame can finish loading before React attaches onLoad,
  // so this listens natively and also measures a frame that already loaded.
  useEffect(() => {
    const frame = frameRef.current

    if (!frame) {
      return
    }

    const fitToContent = () => {
      const body = frame.contentDocument?.body

      if (body) {
        const border = frame.offsetHeight - frame.clientHeight
        setHeight(Math.ceil(body.getBoundingClientRect().height) + border)
      }
    }

    if (frame.contentDocument?.readyState === 'complete') {
      fitToContent()
    }

    frame.addEventListener('load', fitToContent)
    window.addEventListener('resize', fitToContent)

    return () => {
      frame.removeEventListener('load', fitToContent)
      window.removeEventListener('resize', fitToContent)
    }
  }, [])

  return (
    <iframe
      className={styles.emailFrame}
      ref={frameRef}
      sandbox="allow-same-origin"
      srcDoc={deferredHTML}
      style={{ height }}
      title={title}
    />
  )
}
