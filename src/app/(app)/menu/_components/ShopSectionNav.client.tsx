'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

type NavItem = {
  id: string
  label: string
}

type Props = {
  items: NavItem[]
}

export function ShopSectionNav({ items }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeId = searchParams.get('section') ?? items[0]?.id ?? ''
  const shellRef = React.useRef<HTMLDivElement | null>(null)
  const barRef = React.useRef<HTMLDivElement | null>(null)
  const [isPinned, setIsPinned] = React.useState(false)
  const [barHeight, setBarHeight] = React.useState(0)

  React.useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0

      const shell = shellRef.current
      const bar = barRef.current

      if (!shell || !bar) return

      const shellTop = shell.getBoundingClientRect().top + window.scrollY
      const nextPinned = window.scrollY >= shellTop
      const nextHeight = bar.offsetHeight

      setIsPinned((current) => (current === nextPinned ? current : nextPinned))
      setBarHeight((current) => (current === nextHeight ? current : nextHeight))
    }

    const requestMeasure = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    requestMeasure()
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure)

    return () => {
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <div
      ref={shellRef}
      style={isPinned && barHeight > 0 ? { height: `${barHeight}px` } : undefined}
    >
      <div
        className={clsx(
          'bg-[var(--background)]',
          isPinned
            ? 'fixed inset-x-0 top-0 z-30'
            : 'relative left-1/2 z-10 w-screen -translate-x-1/2',
        )}
        ref={barRef}
      >
        <nav aria-label="Menu sections" className="container overflow-x-auto">
          <ul className="flex min-h-[var(--shop-section-nav-height)] min-w-max items-center gap-6 md:gap-8 lg:gap-10">
            {items.map((item) => {
              const isActive = item.id === activeId
              const params = new URLSearchParams(searchParams.toString())
              params.set('section', item.id)
              const href = `${pathname}?${params.toString()}`

              return (
                <li className="flex items-center" key={item.id}>
                  <Link
                    aria-current={isActive ? 'page' : undefined}
                    className={clsx(
                      'inline-flex min-h-[44px] items-center border-b-2 border-transparent pb-1 pt-1 text-[0.98rem] font-medium tracking-[-0.01em] whitespace-nowrap transition-colors duration-200',
                      isActive
                        ? 'border-[#243a61] text-[#243a61]'
                        : 'text-[#243a61]/80 hover:border-[#243a61]/35 hover:text-[#243a61]',
                    )}
                    href={href}
                    scroll={false}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
