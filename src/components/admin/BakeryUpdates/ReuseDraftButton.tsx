'use client'

import { ConfirmationModal, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

import { BakeryPressable } from '@/design-system/bakery'
import type { BakeryUpdateDraft } from '@/features/bakery-updates/content'

import { hasDraftInProgress, saveDraftForReuse } from './draftStorage'
import styles from './index.module.css'

const REPLACE_DRAFT_MODAL = 'confirm-bakery-update-replace-draft'

export const ReuseDraftButton = ({ draft }: { draft: BakeryUpdateDraft }) => {
  const router = useRouter()
  const { openModal } = useModal()

  const reuse = () => {
    saveDraftForReuse(draft)
    router.push('/admin/bakery-updates')
  }

  return (
    <>
      <BakeryPressable
        className={styles.button}
        onClick={() => (hasDraftInProgress() ? openModal(REPLACE_DRAFT_MODAL) : reuse())}
      >
        Use as a new draft
      </BakeryPressable>
      <ConfirmationModal
        body="This replaces the draft you are writing now."
        confirmLabel="Replace my draft"
        heading="Replace your current draft?"
        modalSlug={REPLACE_DRAFT_MODAL}
        onConfirm={reuse}
      />
    </>
  )
}
