'use client'

import React, { useRef } from 'react'

import { cn } from '@/utilities/cn'

import type { MenuSection } from './catering-menu-types'

export type MenuSectionTabDef = {
  detail: string
  label: string
  value: MenuSection
}

type MenuSectionTabsProps = {
  active: MenuSection
  idBase: string
  onChange: (section: MenuSection) => void
  tabs: MenuSectionTabDef[]
}

/**
 * Pill segmented control switching the menu between Regular orders and
 * Catering. Both panels stay server-rendered in the DOM; this only toggles
 * visibility, so switching is instant and search engines see everything.
 */
export function MenuSectionTabs({ active, idBase, onChange, tabs }: MenuSectionTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const focusAndActivate = (index: number) => {
    const nextIndex = (index + tabs.length) % tabs.length
    const tab = tabs[nextIndex]

    if (!tab) {
      return
    }

    tabRefs.current[nextIndex]?.focus()
    onChange(tab.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        focusAndActivate(index - 1)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        focusAndActivate(index + 1)
        break
      case 'End':
        event.preventDefault()
        focusAndActivate(tabs.length - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAndActivate(0)
        break
      default:
        break
    }
  }

  return (
    <>
      <div aria-label="Menu sections" className="menuSectionTabs" role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tab.value === active

          return (
            <button
              aria-controls={`${idBase}-panel-${tab.value}`}
              aria-selected={isActive}
              className={cn('menuSectionTab', isActive && 'menuSectionTabActive')}
              id={`${idBase}-tab-${tab.value}`}
              key={tab.value}
              onClick={() => onChange(tab.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              <span className="menuSectionTabLabel">{tab.label}</span>
              <span className="menuSectionTabDetail">{tab.detail}</span>
            </button>
          )
        })}
      </div>

      <style>{`
        .menuSectionTabs {
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(23, 21, 16, 0.12);
          border-radius: 999px;
          box-shadow: 0 10px 24px rgba(23, 21, 16, 0.06);
          display: grid;
          gap: 0.3rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-inline: auto;
          max-width: 36rem;
          padding: 0.3rem;
          width: 100%;
        }

        .menuSectionTab {
          align-items: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 999px;
          color: rgba(23, 21, 16, 0.74);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.16rem;
          justify-content: center;
          min-height: 3.5rem;
          padding: 0.6rem 1.1rem 0.66rem;
          text-align: center;
          transition:
            background-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            border-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            color 150ms cubic-bezier(0.6, 0, 0.15, 1);
        }

        .menuSectionTab:hover {
          background: rgba(23, 52, 31, 0.08);
          color: #171510;
        }

        .menuSectionTab:focus-visible {
          outline: 2px solid rgba(25, 56, 34, 0.65);
          outline-offset: -3px;
        }

        .menuSectionTabActive,
        .menuSectionTabActive:hover {
          background: #17341f;
          border-color: #17341f;
          color: #f7f5ef;
        }

        .menuSectionTabLabel {
          font-family: var(--font-rounded-display);
          font-size: 1.02rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.05;
        }

        .menuSectionTabDetail {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          line-height: 1.2;
          opacity: 0.74;
          text-transform: uppercase;
        }

        @media (max-width: 480px) {
          .menuSectionTab {
            min-height: 3.25rem;
            padding-inline: 0.5rem;
          }

          .menuSectionTabLabel {
            font-size: 0.94rem;
          }

          .menuSectionTabDetail {
            font-size: 0.6rem;
            letter-spacing: 0.05em;
          }
        }
      `}</style>
    </>
  )
}
