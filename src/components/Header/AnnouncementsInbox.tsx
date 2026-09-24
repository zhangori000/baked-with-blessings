'use client'

import { BakeryPressable } from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import { useMemo, useState } from 'react'

import { BackGlyph, PinGlyph } from './HeaderGlyphs'

type InboxItem = {
  id?: null | string
  message: string
  pinned?: boolean | null
  postedOn?: null | string
  title: string
}

type Props = {
  items: InboxItem[]
  onClose: () => void
}

const signoffName = 'Baked with Blessings'

function previewOf(message: string) {
  const compact = message.replace(/\s+/g, ' ').trim()
  if (compact.length <= 72) return compact
  return `${compact.slice(0, 69).trim()}…`
}

function formatPostedOn(value?: null | string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function sortInbox(items: InboxItem[]) {
  return [...items].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
      return left.pinned ? -1 : 1
    }

    const leftTime = left.postedOn ? Date.parse(left.postedOn) : 0
    const rightTime = right.postedOn ? Date.parse(right.postedOn) : 0
    return rightTime - leftTime
  })
}

export function AnnouncementsInbox({ items, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(() => sortInbox(items ?? []), [items])
  const pinnedRows = rows.filter((row) => row.pinned)
  const updateRows = rows.filter((row) => !row.pinned)
  const selected = rows.find((item, index) => (item.id || String(index)) === selectedId) ?? null
  const showDetail = Boolean(selected)

  const renderRow = (entry: InboxItem, index: number) => {
    const rowId = entry.id || String(index)
    const posted = formatPostedOn(entry.postedOn)

    return (
      <li key={rowId}>
        <button
          className={cn('announcementsInboxRow', entry.pinned && 'is-pinned')}
          onClick={() => setSelectedId(rowId)}
          type="button"
        >
          <span className="announcementsInboxRowMark" aria-hidden="true">
            {entry.pinned ? <PinGlyph className="announcementsInboxPin" /> : <span className="announcementsInboxUnread" />}
          </span>
          <span className="announcementsInboxRowCopy">
            <span className="announcementsInboxRowHeadline">
              <strong>{entry.title}</strong>
              {posted ? <time dateTime={entry.postedOn ?? undefined}>{posted}</time> : null}
            </span>
            <span>{previewOf(entry.message)}</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="announcementsInbox">
      <div className={cn('announcementsInboxTrack', showDetail && 'is-detail')}>
        <div className="announcementsInboxPane announcementsInboxListPane">
          <div className="announcementsInboxHeader">
            <div>
              <p className="announcementsInboxEyebrow">Inbox</p>
              <h2 className="announcementsInboxTitle">From the baker</h2>
            </div>
            <BakeryPressable
              aria-label="Close announcements"
              className="announcementsInboxClose"
              onClick={onClose}
              type="button"
            >
              Close
            </BakeryPressable>
          </div>
          {rows.length ? (
            <>
              {pinnedRows.length ? (
                <div className="announcementsInboxGroup">
                  <p className="announcementsInboxGroupLabel">Pinned</p>
                  <ul className="announcementsInboxRows">{pinnedRows.map(renderRow)}</ul>
                </div>
              ) : null}
              {updateRows.length ? (
                <div className="announcementsInboxGroup">
                  <p className="announcementsInboxGroupLabel">Updates</p>
                  <ul className="announcementsInboxRows">
                    {updateRows.map((entry, index) => renderRow(entry, pinnedRows.length + index))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p className="announcementsInboxEmpty">Nothing new right now. Check back soon.</p>
          )}
        </div>

        <div className="announcementsInboxPane announcementsInboxDetailPane">
          {selected ? (
            <>
              <BakeryPressable
                className="announcementsInboxBack"
                onClick={() => setSelectedId(null)}
                type="button"
              >
                <BackGlyph className="h-4 w-4" />
                <span>Back</span>
              </BakeryPressable>
              <p className="announcementsInboxDetailMeta">
                {selected.pinned ? (
                  <span className="announcementsInboxDetailPin">
                    <PinGlyph className="announcementsInboxPin" />
                    Pinned
                  </span>
                ) : null}
                {selected.postedOn ? (
                  <time dateTime={selected.postedOn}>{formatPostedOn(selected.postedOn)}</time>
                ) : null}
              </p>
              <h2 className="announcementsInboxDetailTitle">{selected.title}</h2>
              <p className="announcementsInboxDetailMessage">{selected.message}</p>
              <p className="announcementsInboxSignoff">
                Sincerely,
                <span className="announcementsInboxSignoffName">{signoffName}</span>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
