import { getPodium } from '@/features/flavor-polls/results'
import type { PollStandings } from '@/features/flavor-polls/types'

export const pluralTokens = (count: number) => `${count} ${count === 1 ? 'token' : 'tokens'}`

export const pluralPeople = (count: number) => `${count} ${count === 1 ? 'person' : 'people'}`

export function Standings({
  myPicks,
  standings,
  title,
}: {
  myPicks: Record<number, number>
  standings: PollStandings
  title: string
}) {
  const topVotes = Math.max(1, ...standings.rows.map((row) => row.votes))

  return (
    <section aria-labelledby="vote-standings-title" className="voteStandings">
      <div className="voteStandingsHeader">
        <h2 className="voteSectionTitle" id="vote-standings-title">
          {title}
        </h2>
        <p className="voteMuted">
          {pluralPeople(standings.voterCount)} voted · {pluralTokens(standings.totalVotes)} spent
        </p>
      </div>
      <ol className="voteStandingsList">
        {standings.rows.map((row) => {
          const mine = myPicks[row.productId] ?? 0
          return (
            <li className="voteStandingsRow" key={row.productId}>
              <span className="voteStandingsRank">{row.rank}</span>
              <div className="voteStandingsMain">
                <div className="voteStandingsLabel">
                  <span className="voteStandingsName">{row.title}</span>
                  {mine > 0 ? <span className="voteStandingsMine">You: {mine}</span> : null}
                  <span className="voteStandingsVotes">{pluralTokens(row.votes)}</span>
                </div>
                <span aria-hidden="true" className="voteStandingsTrack">
                  {row.votes > 0 ? (
                    <span
                      className="voteStandingsBar"
                      style={{ width: `${(row.votes / topVotes) * 100}%` }}
                    />
                  ) : null}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function Podium({ standings }: { standings: PollStandings }) {
  const groups = getPodium(standings.rows)
  if (groups.length === 0) return null

  return (
    <ol className="votePodium">
      {groups.map((group) => (
        <li className="votePodiumItem" data-rank={group.rank} key={group.rank}>
          <span aria-hidden="true" className="votePodiumRank">
            {group.rank}
          </span>
          <span className="votePodiumName">
            <span className="sr-only">
              {group.rank === 1 ? 'First place' : group.rank === 2 ? 'Second place' : 'Third place'}
              {group.titles.length > 1 ? ', tied' : ''}:{' '}
            </span>
            {group.titles.join(' · ')}
          </span>
          <span className="votePodiumVotes">{pluralTokens(group.votes)}</span>
        </li>
      ))}
    </ol>
  )
}
