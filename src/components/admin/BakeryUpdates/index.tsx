import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import { isAdminUser } from '@/access/utilities'
import { getBakeryCompanyName, loadBakeryUpdatesOverview } from '@/features/bakery-updates/service'

import { BakeryUpdateComposer } from './BakeryUpdateComposer'
import styles from './index.module.css'

export const BakeryUpdatesView = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  const { locale, permissions, req, visibleEntities } = initPageResult

  if (!req.user || !isAdminUser(req.user)) {
    redirect('/admin/login')
  }

  const overview = await loadBakeryUpdatesOverview(req.payload)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={{
        collections: visibleEntities?.collections,
        globals: visibleEntities?.globals,
      }}
    >
      <Gutter className={styles.gutter}>
        <BakeryUpdateComposer
          adminEmail={typeof req.user.email === 'string' ? req.user.email : ''}
          companyName={getBakeryCompanyName()}
          overview={overview}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
