import type { PollStandingsRow } from './types'

export const SHARE_PODIUM_SIZE = 3

export const rankStandings = (rows: Omit<PollStandingsRow, 'rank'>[]): PollStandingsRow[] => {
  const sorted = [...rows].sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))
  const ranked: PollStandingsRow[] = []

  sorted.forEach((row, index) => {
    const previous = ranked[index - 1]
    const rank = previous && previous.votes === row.votes ? previous.rank : index + 1
    ranked.push({ ...row, rank })
  })

  return ranked
}

export const getPodium = (rows: PollStandingsRow[], size = SHARE_PODIUM_SIZE) => {
  const groups: { rank: number; titles: string[]; votes: number }[] = []

  for (const row of rows) {
    if (row.votes <= 0 || row.rank > size) continue
    const group = groups.find((entry) => entry.rank === row.rank)
    if (group) {
      group.titles.push(row.title)
    } else {
      groups.push({ rank: row.rank, titles: [row.title], votes: row.votes })
    }
  }

  return groups
}

export const joinTitles = (titles: string[]) => {
  if (titles.length <= 1) return titles[0] ?? ''
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`
  return `${titles.slice(0, -1).join(', ')}, and ${titles[titles.length - 1]}`
}

export const formatPodiumLine = (group: { rank: number; titles: string[] }) =>
  `${group.rank}. ${joinTitles(group.titles)}${group.titles.length > 1 ? ' (tie)' : ''}`

export const buildResultsShareMessage = ({
  rows,
  url,
}: {
  rows: PollStandingsRow[]
  url: string
}) => {
  const podium = getPodium(rows)
  if (podium.length === 0) return null

  return [
    'The flavor vote results are in!',
    '',
    ...podium.map(formatPodiumLine),
    '',
    `See the full results: ${url}`,
  ].join('\n')
}
