'use client'

import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/cn'

import './scroll-cue-area.css'

type ScrollCueAreaProps = {
  children: ReactNode
  className?: string
  label?: string
}

export function ScrollCueArea({ children, className, label = 'More' }: ScrollCueAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState({ atEnd: true, overflowing: false })

  const measure = useCallback(() => {
    const node = scrollRef.current

    if (!node) {
      return
    }

    const overflowing = node.scrollHeight - node.clientHeight > 2
    const atEnd = node.scrollTop + node.clientHeight >= node.scrollHeight - 2

    setState((current) =>
      current.overflowing === overflowing && current.atEnd === atEnd
        ? current
        : { atEnd, overflowing },
    )
  }, [])

  useEffect(() => {
    const node = scrollRef.current

    if (!node) {
      return
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)

    for (const child of Array.from(node.children)) {
      observer.observe(child)
    }

    return () => observer.disconnect()
  }, [children, measure])

  const showCue = state.overflowing && !state.atEnd

  return (
    <div className="scrollCueArea">
      <div
        className={cn(className, 'scrollCueAreaScroll')}
        data-cue={showCue || undefined}
        onScroll={measure}
        ref={scrollRef}
        tabIndex={state.overflowing ? 0 : undefined}
      >
        {children}
      </div>
      {showCue ? (
        <button
          aria-hidden="true"
          className="scrollCueAreaChip"
          onClick={() => {
            const node = scrollRef.current

            node?.scrollBy({ behavior: 'smooth', top: node.clientHeight * 0.8 })
          }}
          tabIndex={-1}
          type="button"
        >
          {label}
          <ChevronDown aria-hidden="true" size={12} strokeWidth={2.6} />
        </button>
      ) : null}
    </div>
  )
}
