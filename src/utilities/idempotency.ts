import { createHash } from 'crypto'

export const createStableHash = (value: string, length = 32) =>
  createHash('sha256').update(value).digest('hex').slice(0, length)

export const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  return (
    code === '23505' ||
    code === '11000' ||
    message.includes('duplicate key') ||
    message.includes('unique constraint') ||
    message.includes('already exists')
  )
}
