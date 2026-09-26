'use client'

import type { Product } from '@/payload-types'
import { BakeryCard } from '@/design-system/bakery'
import { resolveCateringStep } from '@/features/products/cateringPackages'
import { oldFlavorsHref } from '@/utilities/routes'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export type CateringPackageRow = {
  product: Partial<Product>
  rowTitle: string
  step: number
}

export type CateringPackageGroup = {
  heading: string
  key: string
  rows: CateringPackageRow[]
  step: number
}

const TITLE_SEPARATOR = /\s+[—–-]\s+/

const splitTitle = (title: string) => {
  const [heading, ...rest] = title.split(TITLE_SEPARATOR)

  if (!rest.length || !heading) {
    return { heading: 'Catering', rowTitle: title }
  }

  return { heading: heading.trim(), rowTitle: rest.join(' — ').trim() }
}

const capacityOf = (product: Partial<Product>) =>
  typeof product.requiredSelectionCount === 'number' ? product.requiredSelectionCount : 0

const groupRank = (key: string) => (key.includes('mini') ? 0 : 1)

export const groupCateringPackages = (products: Partial<Product>[]): CateringPackageGroup[] => {
  const groups = new Map<
    string,
    { heading: string; items: { product: Partial<Product>; rowTitle: string }[] }
  >()

  for (const product of products) {
    const { heading, rowTitle } = splitTitle(product.title ?? 'Catering')
    const key = heading.toLowerCase()
    const group = groups.get(key) ?? { heading, items: [] }
    group.items.push({ product, rowTitle })
    groups.set(key, group)
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => groupRank(left) - groupRank(right) || left.localeCompare(right))
    .map(([key, group]) => {
      const capacities = group.items.map((item) => capacityOf(item.product))
      const rows = [...group.items]
        .sort((left, right) => capacityOf(left.product) - capacityOf(right.product))
        .map((item) => ({
          ...item,
          step: resolveCateringStep(capacityOf(item.product), capacities),
        }))

      return {
        heading: group.heading,
        key,
        rows,
        step: rows[0]?.step ?? 1,
      }
    })
}

export function CateringPackagesIntro() {
  return (
    <BakeryCard className="cateringPackagesIntro" radius="lg" spacing="none" tone="outline">
      <div className="cateringPackagesIntroCopy">
        <p className="cateringMenuRoundHeading cateringPackagesIntroTitle">
          Any flavor, even past favorites
        </p>
        <p className="cateringPackagesIntroBody">
          Catering is the one place you can order any flavor we have ever baked, not just this
          week’s lineup. Pick a package, then mix the flavors however you like.
        </p>
      </div>
      <Link
        className="cateringMenuRoundHeading cateringPackagesIntroLink group"
        href={oldFlavorsHref}
      >
        Browse past flavors
        <ArrowRight
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5"
          size={16}
          strokeWidth={2.4}
        />
      </Link>

      <style>{`
        .cateringPackagesIntro {
          align-items: center;
          background: var(--bakery-color-cream-50, #fffaf0);
          border-color: rgba(23, 21, 16, 0.12);
          display: flex;
          flex-wrap: wrap;
          gap: 1rem 1.5rem;
          justify-content: space-between;
          margin-top: 1.4rem;
          padding: 1.15rem 1.25rem;
        }

        .cateringPackagesIntroCopy {
          display: grid;
          gap: 0.35rem;
          max-width: 40rem;
        }

        .cateringPackagesIntroTitle {
          color: #171510;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .cateringPackagesIntroBody {
          color: rgba(23, 21, 16, 0.66);
          font-size: 0.92rem;
          line-height: 1.6;
          margin: 0;
        }

        .cateringPackagesIntroLink {
          align-items: center;
          border: 1px solid rgba(23, 21, 16, 0.18);
          border-radius: 999px;
          color: #171510;
          display: inline-flex;
          flex-shrink: 0;
          font-size: 0.86rem;
          gap: 0.5rem;
          letter-spacing: -0.01em;
          padding: 0.6rem 1.15rem;
          transition: background-color 150ms ease, border-color 150ms ease;
        }

        .cateringPackagesIntroLink:hover {
          background: rgba(23, 21, 16, 0.05);
          border-color: rgba(23, 21, 16, 0.3);
        }

        .cateringPackagesGroupHeader {
          border-bottom: 1px solid rgba(23, 21, 16, 0.14);
          display: grid;
          gap: 0.45rem;
          margin-top: 2.4rem;
          padding: 0 0 1.15rem;
        }

        .cateringPackagesGroupHeading {
          color: #171510;
          font-size: clamp(1.85rem, 4.6vw, 2.55rem);
          letter-spacing: -0.035em;
          line-height: 1.02;
          margin: 0;
        }

        .cateringPackagesGroupDescription {
          color: rgba(23, 21, 16, 0.58);
          font-size: 0.98rem;
          line-height: 1.55;
          margin: 0;
          max-width: 34rem;
        }
      `}</style>
    </BakeryCard>
  )
}

export function CateringPackagesGroupHeader({ group }: { group: CateringPackageGroup }) {
  const headingId = `catering-group-${group.key.replace(/[^a-z0-9]+/g, '-')}`

  return (
    <header className="cateringPackagesGroupHeader">
      <h2 className="cateringMenuRoundHeading cateringPackagesGroupHeading" id={headingId}>
        {group.heading}
      </h2>
      <p className="cateringPackagesGroupDescription">
        {group.step > 1
          ? `Choose flavors in sets of ${group.step}. Every package can mix any flavors.`
          : 'Every package can mix any flavors.'}
      </p>
    </header>
  )
}
