import { describe, expect, it, vi } from 'vitest'

import { getNextScheduledPollClose } from '@/features/flavor-polls/schedule'
import { buildResultsShareMessage, getPodium, rankStandings } from '@/features/flavor-polls/results'
import {
  findBallot,
  FlavorPollError,
  isPollOpen,
  submitBallot,
  tallyPoll,
} from '@/features/flavor-polls/services'
import type { PublicPoll } from '@/features/flavor-polls/types'

describe('flavor poll schedule', () => {
  it('closes on the coming Sunday at 8pm Central', () => {
    expect(getNextScheduledPollClose(new Date('2026-09-24T18:30:00Z')).toISOString()).toBe(
      '2026-09-28T01:00:00.000Z',
    )
  })

  it('rolls to the following Sunday once 8pm has passed', () => {
    expect(getNextScheduledPollClose(new Date('2026-09-28T01:00:00Z')).toISOString()).toBe(
      '2026-10-05T01:00:00.000Z',
    )
  })

  it('follows Central time across daylight saving changes', () => {
    expect(getNextScheduledPollClose(new Date('2026-11-01T12:00:00Z')).toISOString()).toBe(
      '2026-11-02T02:00:00.000Z',
    )
    expect(getNextScheduledPollClose(new Date('2026-03-08T02:00:00Z')).toISOString()).toBe(
      '2026-03-09T01:00:00.000Z',
    )
  })
})

const poll: PublicPoll = {
  allowFlavorIdeas: true,
  closesAt: '2999-01-01T00:00:00.000Z',
  id: 7,
  isOpen: true,
  opensAt: null,
  options: [
    { fallbackSrc: '', image: null, productId: 1, slug: 'a', summary: '', title: 'A' },
    { fallbackSrc: '', image: null, productId: 2, slug: 'b', summary: '', title: 'B' },
  ],
  showStandingsAfterVoting: true,
  title: 'Vote',
  votesPerPerson: 3,
}

const makePayload = (existing: unknown = null) => {
  const create = vi.fn(async ({ data }) => ({ id: 1, ...data }))
  const update = vi.fn(async ({ data }) => ({ id: 1, ...data }))
  const find = vi.fn(async () => ({ docs: existing ? [existing] : [] }))
  return { create, find, update } as const
}

const submit = (picks: unknown, payload = makePayload(), overrides: Partial<PublicPoll> = {}) =>
  submitBallot({
    flavorIdea: '  Ube   crinkle ',
    payload: payload as never,
    picks,
    poll: { ...poll, ...overrides },
    voterKey: 'voter',
  })

describe('flavor poll ballots', () => {
  it('lets a voter stack every token on one flavor', async () => {
    const payload = makePayload()
    const ballot = await submit({ 1: 3 }, payload)

    expect(ballot).toEqual({ flavorIdea: 'Ube crinkle', picks: { 1: 3 } })
    expect(payload.create).toHaveBeenCalledOnce()
  })

  it('replaces an earlier ballot instead of adding a second one', async () => {
    const payload = makePayload({ id: 9, picks: [], poll: 7, voterKey: 'voter' })
    await submit({ 1: 1, 2: 2 }, payload)

    expect(payload.update).toHaveBeenCalledOnce()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects more tokens than the poll allows', async () => {
    await expect(submit({ 1: 2, 2: 2 })).rejects.toBeInstanceOf(FlavorPollError)
  })

  it('rejects flavors that are not on the ballot', async () => {
    await expect(submit({ 99: 1 })).rejects.toThrow('not on this week')
  })

  it('rejects an empty ballot', async () => {
    await expect(submit({})).rejects.toThrow('at least one')
  })

  it('rejects votes after the poll closes', async () => {
    await expect(submit({ 1: 1 }, makePayload(), { isOpen: false })).rejects.toThrow('closed')
  })

  it('drops the flavor idea when the poll does not ask for one', async () => {
    const ballot = await submit({ 1: 1 }, makePayload(), { allowFlavorIdeas: false })
    expect(ballot.flavorIdea).toBe('')
  })
})

describe('saved ballots after the ballot changes', () => {
  const staleVote = {
    flavorIdea: 'Ube',
    id: 9,
    picks: [
      { count: 2, product: 1 },
      { count: 1, product: 99 },
    ],
    poll: 7,
    voterKey: 'voter',
  }

  it('drops picks for flavors that left the ballot', async () => {
    const ballot = await findBallot(makePayload(staleVote) as never, poll, 'voter')
    expect(ballot).toEqual({ flavorIdea: 'Ube', picks: { 1: 2 } })
  })

  it('treats a ballot with only removed flavors as not voted yet', async () => {
    const onlyRemoved = { ...staleVote, picks: [{ count: 3, product: 99 }] }
    expect(await findBallot(makePayload(onlyRemoved) as never, poll, 'voter')).toBeNull()
  })

  it('only counts tokens for flavors still on the ballot', async () => {
    const { standings } = await tallyPoll(makePayload(staleVote) as never, poll)
    expect(standings.totalVotes).toBe(2)
    expect(standings.rows.reduce((sum, row) => sum + row.votes, 0)).toBe(2)
  })
})

describe('poll opening window', () => {
  const now = Date.parse('2026-09-24T12:00:00Z')
  const base = { closesAt: '2026-09-28T01:00:00Z', status: 'live' as const }

  it('opens as soon as it is live when no opening time is set', () => {
    expect(isPollOpen({ ...base, opensAt: null }, now)).toBe(true)
  })

  it('waits for a scheduled opening time', () => {
    expect(isPollOpen({ ...base, opensAt: '2026-09-25T14:00:00Z' }, now)).toBe(false)
    expect(isPollOpen({ ...base, opensAt: '2026-09-24T11:00:00Z' }, now)).toBe(true)
  })

  it('stays shut while hidden or after closing', () => {
    expect(isPollOpen({ ...base, opensAt: null, status: 'draft' }, now)).toBe(false)
    expect(isPollOpen({ ...base, closesAt: '2026-09-24T11:59:00Z', opensAt: null }, now)).toBe(
      false,
    )
  })
})

describe('results sharing', () => {
  const rows = rankStandings([
    { productId: 1, title: 'Brookie', votes: 4 },
    { productId: 2, title: 'Biscoff', votes: 4 },
    { productId: 3, title: 'Dirty Chai', votes: 3 },
    { productId: 4, title: 'Cinnamon Roll', votes: 1 },
    { productId: 5, title: 'Banana Crumble', votes: 0 },
  ])

  it('gives tied flavors the same place', () => {
    expect(rows.map((row) => [row.title, row.rank])).toEqual([
      ['Biscoff', 1],
      ['Brookie', 1],
      ['Dirty Chai', 3],
      ['Cinnamon Roll', 4],
      ['Banana Crumble', 5],
    ])
  })

  it('keeps the podium to the top three places with votes', () => {
    expect(getPodium(rows).map((group) => [group.rank, group.titles])).toEqual([
      [1, ['Biscoff', 'Brookie']],
      [3, ['Dirty Chai']],
    ])
  })

  it('builds a ready-to-send message with the link', () => {
    expect(buildResultsShareMessage({ rows, url: 'https://example.test/vote/results/7' })).toBe(
      [
        'The flavor vote results are in!',
        '',
        '1. Biscoff and Brookie (tie)',
        '3. Dirty Chai',
        '',
        'See the full results: https://example.test/vote/results/7',
      ].join('\n'),
    )
  })

  it('has nothing to send when no one voted', () => {
    const empty = rankStandings([{ productId: 1, title: 'Brookie', votes: 0 }])
    expect(buildResultsShareMessage({ rows: empty, url: 'https://example.test' })).toBeNull()
  })
})
