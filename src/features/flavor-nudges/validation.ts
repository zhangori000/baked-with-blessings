export const NUDGE_MAX_PER_REQUEST = 24
const EMAIL_PATTERN =
  /^(?!.*\.\.)[\w!#$%&'*+/=?^`{|}~-](?:[\w!#$%&'*+/=?^`{|}~.-]*[\w!#$%&'*+/=?^`{|}~-])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i

export class FlavorNudgeError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export const normalizeNudgeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email) return null
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new FlavorNudgeError('That email does not look right. Check it and try again.')
  }
  return email
}

export const parseNudgeProductIDs = (value: unknown, allowed: Set<number>): number[] => {
  const ids = Array.isArray(value)
    ? Array.from(
        new Set(
          value.map((item) => Number(item)).filter((id) => Number.isInteger(id) && allowed.has(id)),
        ),
      )
    : []

  if (ids.length === 0) {
    throw new FlavorNudgeError('Pick at least one old flavor to bring back.')
  }
  if (ids.length > NUDGE_MAX_PER_REQUEST) {
    throw new FlavorNudgeError('That is a lot of flavors at once. Pick a few favorites.')
  }
  return ids
}
