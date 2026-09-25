import type { ReactNode } from 'react'

import {
  BakeryPageEyebrow,
  BakeryPageLead,
  BakeryPageSurface,
  BakeryPageTitle,
} from '@/design-system/bakery'

import styles from './index.module.css'

export const legalPagesUpdated = 'September 24, 2026'

type LegalPageProps = {
  children: ReactNode
  eyebrow: string
  lead: ReactNode
  title: string
  updated: string
}

export function LegalPage({ children, eyebrow, lead, title, updated }: LegalPageProps) {
  return (
    <BakeryPageSurface as="article" className={styles.page} spacing="lg" width="narrow">
      <header className={styles.header}>
        <BakeryPageEyebrow>{eyebrow}</BakeryPageEyebrow>
        <BakeryPageTitle>{title}</BakeryPageTitle>
        <BakeryPageLead>{lead}</BakeryPageLead>
        <p className={styles.updated}>Last updated {updated}</p>
      </header>
      <div className={styles.body}>{children}</div>
    </BakeryPageSurface>
  )
}

export function LegalSection({
  children,
  id,
  title,
}: {
  children: ReactNode
  id?: string
  title: string
}) {
  return (
    <section className={styles.section} id={id}>
      <BakeryPageTitle as="h2" size="section">
        {title}
      </BakeryPageTitle>
      {children}
    </section>
  )
}
