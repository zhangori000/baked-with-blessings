'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import type { PollStandings } from '@/features/flavor-polls/types'

import './FlavorPollResultsField.css'

type ResultsResponse = {
  error?: string
  flavorIdeas?: string[]
  hasClosed?: boolean
  isLive?: boolean
  isOpen?: boolean
  resultsUrl?: string | null
  shareMessage?: string | null
  standings?: PollStandings
  success?: boolean
}

const COPIED_FEEDBACK_MS = 2000

const describeStatus = (data: ResultsResponse | null) => {
  if (!data?.isLive) return 'Hidden from the site.'
  if (data.isOpen) return 'Voting is open.'
  if (data.hasClosed) return 'Voting is closed.'
  return 'Voting has not opened yet.'
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <Button
      buttonStyle="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        } catch {
          setCopied(false)
        }
      }}
      size="small"
    >
      {copied ? 'Copied!' : label}
    </Button>
  )
}

function SharePanel({ data }: { data: ResultsResponse | null }) {
  if (!data?.isLive) return null

  if (!data.resultsUrl) {
    return (
      <div className={`${baseClass}__share`}>
        <p className={`${baseClass}__label`}>Share the results</p>
        <p className={`${baseClass}__hint`}>
          A link to the results, plus a message you can paste into an email or text, shows up here
          once voting closes.
        </p>
      </div>
    )
  }

  return (
    <div className={`${baseClass}__share`}>
      <p className={`${baseClass}__label`}>Share the results</p>
      <p className={`${baseClass}__hint`}>
        Anyone can open this link. It keeps working after the next vote starts.
      </p>
      <div className={`${baseClass}__shareRow`}>
        <input
          aria-label="Results link"
          className={`${baseClass}__shareInput`}
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={data.resultsUrl}
        />
        <CopyButton label="Copy link" value={data.resultsUrl} />
      </div>
      {data.shareMessage ? (
        <>
          <p className={`${baseClass}__hint`}>Ready-to-send message:</p>
          <textarea
            aria-label="Ready-to-send message"
            className={`${baseClass}__shareMessage`}
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            rows={data.shareMessage.split('\n').length}
            value={data.shareMessage}
          />
          <div>
            <CopyButton label="Copy message" value={data.shareMessage} />
          </div>
        </>
      ) : (
        <p className={`${baseClass}__hint`}>No one voted, so there is no message to send.</p>
      )}
    </div>
  )
}

const baseClass = 'flavor-poll-results-field'

export const FlavorPollResultsField = () => {
  const { id } = useDocumentInfo()
  const [data, setData] = useState<ResultsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (id == null) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/flavor-polls/${id}/results`, {
        cache: 'no-store',
        credentials: 'include',
      })
      setData((await response.json()) as ResultsResponse)
    } catch {
      setData({ error: 'Could not load the results.' })
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (id == null) {
    return (
      <div className={baseClass}>
        <p className={`${baseClass}__label`}>Results</p>
        <p className={`${baseClass}__hint`}>Results show up here once you save this vote.</p>
      </div>
    )
  }

  const standings = data?.standings
  const ideas = data?.flavorIdeas ?? []
  const topVotes = Math.max(1, ...(standings?.rows ?? []).map((row) => row.votes))

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div>
          <p className={`${baseClass}__label`}>Results so far</p>
          {standings ? (
            <p className={`${baseClass}__hint`}>
              {standings.voterCount} {standings.voterCount === 1 ? 'person' : 'people'} voted,{' '}
              {standings.totalVotes} tokens spent. {describeStatus(data)}
            </p>
          ) : null}
        </div>
        <Button buttonStyle="secondary" disabled={isLoading} onClick={load} size="small">
          {isLoading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {data?.error ? <p className={`${baseClass}__hint`}>{data.error}</p> : null}

      <SharePanel data={data} />

      {standings ? (
        <ol className={`${baseClass}__list`}>
          {standings.rows.map((row) => (
            <li className={`${baseClass}__row`} key={row.productId}>
              <span className={`${baseClass}__name`}>{row.title}</span>
              <span className={`${baseClass}__track`}>
                <span
                  className={`${baseClass}__bar`}
                  style={{ width: `${(row.votes / topVotes) * 100}%` }}
                />
              </span>
              <span className={`${baseClass}__votes`}>{row.votes}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <p className={`${baseClass}__label ${baseClass}__label--ideas`}>
        New flavor ideas ({ideas.length})
      </p>
      {ideas.length > 0 ? (
        <ul className={`${baseClass}__ideas`}>
          {ideas.map((idea, index) => (
            <li key={`${idea}-${index}`}>{idea}</li>
          ))}
        </ul>
      ) : (
        <p className={`${baseClass}__hint`}>No ideas yet.</p>
      )}
    </div>
  )
}
