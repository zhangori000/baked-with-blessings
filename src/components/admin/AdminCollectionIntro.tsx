import React from 'react'

import styles from './AdminCollectionIntro.module.css'

export type AdminCollectionIntroProps = {
  children: React.ReactNode
  kicker: string
  title: string
}

export const AdminCollectionIntro = ({ children, kicker, title }: AdminCollectionIntroProps) => (
  <aside className={styles.intro}>
    <p className={styles.kicker}>{kicker}</p>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.body}>{children}</div>
  </aside>
)
