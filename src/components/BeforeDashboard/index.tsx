import Link from 'next/link'
import React from 'react'

import { SeedButton } from './SeedButton'
import styles from './index.module.css'

export const BeforeDashboard: React.FC = () => {
  return (
    <section className={styles.shell}>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          CDS-inspired admin launchpad
        </div>
        <h1 className={styles.title}>Welcome to Baked with Blessing admin.</h1>
        <p className={styles.subtitle}>
          This intro panel sits above Payload&apos;s real widget dashboard. It now uses only local
          CSS modules, which keeps the admin route Turbopack-safe while still giving you a polished
          place for quick-start actions.
        </p>
        <div className={styles.metaRow}>
          <span className={styles.badge}>No shared Payload Sass import</span>
          <Link className={styles.heroLink} href="/">
            Visit the storefront
          </Link>
          <a
            className={styles.heroLink}
            href="https://payloadcms.com/docs/custom-components/custom-views"
            rel="noopener noreferrer"
            target="_blank"
          >
            Read dashboard customization docs
          </a>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={`${styles.card} ${styles.cardAccent}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>Content</span>
            <span className={styles.cardIcon}>01</span>
          </div>
          <h2 className={styles.cardTitle}>Seed starter data</h2>
          <p className={styles.cardBody}>
            Load starter products and pages so the storefront stops feeling empty and the real
            dashboard below has something worth clicking into.
          </p>
          <div className={styles.cardFooter}>
            <SeedButton messageClassName={styles.helperText} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>Payments</span>
            <span className={styles.cardIcon}>02</span>
          </div>
          <h2 className={styles.cardTitle}>Connect Stripe test keys</h2>
          <p className={styles.cardBody}>
            This project still ships with placeholder Stripe credentials, so use test keys while
            you wire up checkout and webhook flows.
          </p>
          <div className={styles.cardFooter}>
            <a
              className={styles.cardLink}
              href="https://dashboard.stripe.com/test/apikeys"
              rel="noopener noreferrer"
              target="_blank"
            >
              Open Stripe dashboard
            </a>
            <a
              className={styles.cardLink}
              href="https://github.com/payloadcms/payload/blob/main/templates/ecommerce/README.md#stripe"
              rel="noopener noreferrer"
              target="_blank"
            >
              Read setup notes
            </a>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>Modeling</span>
            <span className={styles.cardIcon}>03</span>
          </div>
          <h2 className={styles.cardTitle}>Shape your admin around your content</h2>
          <p className={styles.cardBody}>
            Payload&apos;s built-in dashboard still lives below this section. Use it for collections
            and globals while you decide whether you want a custom admin landing page later.
          </p>
          <ul className={styles.cardList}>
            <li>Collections define repeatable content like pages, media, and products.</li>
            <li>Globals handle singleton content like the site header and footer.</li>
            <li>Custom views let you replace the dashboard entirely when you are ready.</li>
          </ul>
          <div className={styles.cardFooter}>
            <a
              className={styles.cardLink}
              href="https://payloadcms.com/docs/configuration/collections"
              rel="noopener noreferrer"
              target="_blank"
            >
              Collections docs
            </a>
            <a
              className={styles.cardLink}
              href="https://payloadcms.com/docs/fields/overview"
              rel="noopener noreferrer"
              target="_blank"
            >
              Fields docs
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
