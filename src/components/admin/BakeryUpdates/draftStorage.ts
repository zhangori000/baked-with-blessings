import type { BakeryUpdateDraft } from '@/features/bakery-updates/content'

/** The composer keeps its draft in this browser under this key. */
export const DRAFT_STORAGE_KEY = 'bwb-bakery-update-draft'

export const newRequestKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const hasDraftInProgress = (): boolean => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || 'null') as {
      message?: unknown
      subject?: unknown
    } | null

    return [stored?.message, stored?.subject].some(
      (value) => typeof value === 'string' && value.trim().length > 0,
    )
  } catch {
    return false
  }
}

// A fresh request key makes this a new update, never a resend of the old one.
export const saveDraftForReuse = (draft: BakeryUpdateDraft) =>
  window.localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ ...draft, requestKey: newRequestKey() }),
  )
