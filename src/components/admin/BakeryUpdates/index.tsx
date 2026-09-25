import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, Link } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import { isAdminUser } from '@/access/utilities'
import {
  type BakeryUpdateDetail,
  getBakeryCompanyName,
  loadBakeryUpdateDetail,
  loadBakeryUpdatesOverview,
} from '@/features/bakery-updates/service'

import { BakeryUpdateComposer } from './BakeryUpdateComposer'
import { EmailPreviewFrame } from './EmailPreviewFrame'
import { channelSummary, formatDate } from './format'
import styles from './index.module.css'
import { ReuseDraftButton } from './ReuseDraftButton'

const AdminPage = ({
  children,
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps & { children: React.ReactNode }) => {
  const { locale, permissions, req, visibleEntities } = initPageResult

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
      <Gutter className={styles.gutter}>{children}</Gutter>
    </DefaultTemplate>
  )
}

const sentLine = ({ finishedAt, progress, sentBy }: BakeryUpdateDetail) => {
  const by = sentBy ? ` by ${sentBy}` : ''

  return progress.done
    ? `Sent ${formatDate(finishedAt ?? progress.createdAt)}${by}.`
    : `Started ${formatDate(progress.createdAt)}${by}. It has not finished sending.`
}

export const BakeryUpdateDetailView = async (props: AdminViewServerProps) => {
  const { req } = props.initPageResult

  if (!req.user || !isAdminUser(req.user)) {
    redirect('/admin/login')
  }

  const segments = Array.isArray(props.params?.segments) ? props.params.segments : []
  const id = Number(segments[1])
  const detail =
    Number.isInteger(id) && id > 0 ? await loadBakeryUpdateDetail(req.payload, id) : null

  return (
    <AdminPage {...props}>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link className={styles.backLink} href="/admin/bakery-updates" prefetch={false}>
            Back to bakery updates
          </Link>
          {detail ? (
            <>
              <p className={styles.kind}>{detail.kind}</p>
              <h1 className={styles.title}>{detail.progress.subject}</h1>
              <p className={styles.subtitle}>{sentLine(detail)}</p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Update not found</h1>
              <p className={styles.subtitle}>It may have been removed.</p>
            </>
          )}
        </header>

        {detail ? (
          <>
            <ul className={styles.detailCounts}>
              {detail.progress.sendText ? (
                <li>{channelSummary('texts', detail.progress.sms)}</li>
              ) : null}
              {detail.progress.sendEmail ? (
                <li>{channelSummary('emails', detail.progress.email)}</li>
              ) : null}
            </ul>

            <div className={styles.actions}>
              <ReuseDraftButton draft={detail.reuse} />
              {detail.progress.done ? null : (
                <Link
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  href="/admin/bakery-updates"
                  prefetch={false}
                >
                  Finish sending
                </Link>
              )}
            </div>
            <p className={styles.helper}>
              Use as a new draft opens the writer with these words filled in. Nothing is sent until
              you press Send.
            </p>

            <div className={styles.detailPreviews}>
              {detail.smsBody ? (
                <figure className={styles.preview}>
                  <figcaption className={styles.previewLabel}>The text</figcaption>
                  <p className={styles.smsBubble}>{detail.smsBody}</p>
                </figure>
              ) : null}
              {detail.emailHTML ? (
                <figure className={styles.preview}>
                  <figcaption className={styles.previewLabel}>The email</figcaption>
                  <EmailPreviewFrame html={detail.emailHTML} title="The email" />
                </figure>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </AdminPage>
  )
}

export const BakeryUpdatesView = async (props: AdminViewServerProps) => {
  const { req } = props.initPageResult

  if (!req.user || !isAdminUser(req.user)) {
    redirect('/admin/login')
  }

  const overview = await loadBakeryUpdatesOverview(req.payload)

  return (
    <AdminPage {...props}>
      <BakeryUpdateComposer
        adminEmail={typeof req.user.email === 'string' ? req.user.email : ''}
        companyName={getBakeryCompanyName()}
        overview={overview}
      />
    </AdminPage>
  )
}
