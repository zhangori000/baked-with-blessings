import type { BakeryUpdateProgress } from '@/features/bakery-updates/service'

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))

export const channelSummary = (label: 'emails' | 'texts', tally: BakeryUpdateProgress['sms']) => {
  const parts = [`${tally.sent} sent`]

  if (tally.failed) {
    parts.push(`${tally.failed} did not go through`)
  }

  if (tally.skipped) {
    parts.push(`${tally.skipped} skipped`)
  }

  if (tally.queued + tally.sending) {
    parts.push(`${tally.queued + tally.sending} waiting`)
  }

  return `${label === 'texts' ? 'Texts' : 'Emails'}: ${parts.join(', ')}`
}
