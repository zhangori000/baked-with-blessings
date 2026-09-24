import { randomUUID } from 'node:crypto'

import { FLAVOR_POLL_VOTER_COOKIE } from './constants'
import { hashVoterToken } from './services'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export const readVoterKey = (token: string | undefined | null) =>
  token && /^[0-9a-f-]{36}$/i.test(token) ? hashVoterToken(token) : null

export const createVoterToken = () => randomUUID()

export const voterCookieOptions = {
  httpOnly: true,
  maxAge: ONE_YEAR_SECONDS,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export { FLAVOR_POLL_VOTER_COOKIE }
