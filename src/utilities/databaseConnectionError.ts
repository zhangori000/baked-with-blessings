const connectionErrorCodes = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
])

const connectionErrorMessage = /cannot connect to Postgres|connect ETIMEDOUT|ENETUNREACH/i

const isConnectionErrorRecord = (value: unknown, seen: Set<unknown>): boolean => {
  if (!value || typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)

  const record = value as {
    cause?: unknown
    code?: unknown
    errors?: unknown
    message?: unknown
  }

  if (typeof record.code === 'string' && connectionErrorCodes.has(record.code)) return true
  if (typeof record.message === 'string' && connectionErrorMessage.test(record.message)) return true

  if (
    Array.isArray(record.errors) &&
    record.errors.some((item) => isConnectionErrorRecord(item, seen))
  ) {
    return true
  }

  return isConnectionErrorRecord(record.cause, seen)
}

export const isDatabaseConnectionError = (error: unknown) =>
  isConnectionErrorRecord(error, new Set())
