import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import { isAdminUser } from '@/access/utilities'
import { summarizeNudges } from '@/features/flavor-nudges/service'

import { CopyEmailsButton } from './CopyEmailsButton'
import styles from './index.module.css'

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Chicago',
    year: 'numeric',
  })

export const BringBackRequestsView = async (props: AdminViewServerProps) => {
  const { initPageResult, params, searchParams } = props
  const { locale, permissions, req, visibleEntities } = initPageResult

  if (!req.user || !isAdminUser(req.user)) {
    redirect('/admin/login')
  }

  const rows = await summarizeNudges(req.payload)
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={{
        collections: visibleEntities?.collections,
        globals: visibleEntities?.globals,
      }}
    >
      <Gutter className={styles.gutter}>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>Bring-back requests</h1>
            <p className={styles.subtitle}>
              Customers tap “Bring it back” on old flavors they miss, from the Old Flavors page and
              the flavor vote. Most wanted is at the top. Each person counts once per flavor.
            </p>
          </header>

          {rows.length === 0 ? (
            <p className={styles.empty}>No requests yet. They will show up here as they come in.</p>
          ) : (
            <>
              <p className={styles.total}>
                {total} {total === 1 ? 'request' : 'requests'} across {rows.length}{' '}
                {rows.length === 1 ? 'flavor' : 'flavors'}
              </p>
              <ol className={styles.list}>
                {rows.map((row) => (
                  <li className={styles.row} key={row.productId}>
                    <div className={styles.rowMain}>
                      <span className={styles.flavor}>{row.title}</span>
                      <span className={styles.count}>
                        {row.count} {row.count === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <p className={styles.meta}>
                      Last asked {formatDay(row.lastNudgedAt)} ·{' '}
                      {row.emails.length === 0
                        ? 'No one left an email'
                        : `${row.emails.length} ${row.emails.length === 1 ? 'wants' : 'want'} an email when it is back`}
                    </p>
                    {row.emails.length > 0 ? (
                      <details className={styles.emails}>
                        <summary>Show emails</summary>
                        <p className={styles.emailList}>{row.emails.join(', ')}</p>
                        <CopyEmailsButton emails={row.emails} />
                      </details>
                    ) : null}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
