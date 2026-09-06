import React, { type ReactNode } from 'react'

import styles from './AdminCollectionIntro.module.css'

export const AdminCollectionIntro = ({ children }: { children: ReactNode }) => (
  <aside className={styles.intro}>{children}</aside>
)
