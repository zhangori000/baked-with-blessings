'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import type { PollStandings } from '@/features/flavor-polls/types'

import './FlavorPollResultsField.css'

type ResultsResponse = {
  error?: string
  flavorIdeas?: string[]
  isOpen?: boolean
  standings?: PollStandings
  success?: boolean
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
              {standings.totalVotes} tokens spent.{' '}
              {data?.isOpen ? 'Voting is still open.' : 'Voting is closed.'}
            </p>
          ) : null}
        </div>
        <Button buttonStyle="secondary" disabled={isLoading} onClick={load} size="small">
          {isLoading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {data?.error ? <p className={`${baseClass}__hint`}>{data.error}</p> : null}

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
