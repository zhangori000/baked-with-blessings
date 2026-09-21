import { createHmac, timingSafeEqual } from 'crypto'

const getUnsubscribeSecret = () =>
  process.env.PAYLOAD_SECRET?.trim() || 'fallback-email-unsubscribe-secret'

export const createEmailUnsubscribeToken = (customerID: number | string = '0') => {
  const id = String(customerID)
  const digest = createHmac('sha256', getUnsubscribeSecret()).update(`email-unsubscribe:${id}`).digest('base64url')
  return `${id}.${digest}`
}

export const readEmailUnsubscribeToken = (token = ''): string | null => {
  const [id, digest] = token.split('.')

  if (!id || !digest) {
    return null
  }

  const expected = createEmailUnsubscribeToken(id)
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(token)

  if (expectedBuffer.length !== actualBuffer.length) {
    return null
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null
  }

  return id
}
