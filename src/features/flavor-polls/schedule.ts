export const FLAVOR_POLL_SCHEDULE = {
  closeHour: 20,
  closeMinute: 0,
  closeWeekday: 0,
  timeZone: 'America/Chicago',
} as const

const WEEKDAY_INDEX: Record<string, number> = {
  Fri: 5,
  Mon: 1,
  Sat: 6,
  Sun: 0,
  Thu: 4,
  Tue: 2,
  Wed: 3,
}

type ZonedParts = {
  day: number
  hour: number
  minute: number
  month: number
  weekday: number
  year: number
}

const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hourCycle: 'h23',
    minute: 'numeric',
    month: 'numeric',
    timeZone,
    weekday: 'short',
    year: 'numeric',
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    day: Number(read('day')),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
    month: Number(read('month')),
    weekday: WEEKDAY_INDEX[read('weekday')] ?? 0,
    year: Number(read('year')),
  }
}

const zonedWallTimeToDate = (
  { day, hour, minute, month, year }: Omit<ZonedParts, 'weekday'>,
  timeZone: string,
) => {
  const wallAsUTC = Date.UTC(year, month - 1, day, hour, minute)
  let guess = wallAsUTC

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const seen = getZonedParts(new Date(guess), timeZone)
    const seenAsUTC = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
    guess += wallAsUTC - seenAsUTC
  }

  return new Date(guess)
}

export const getNextScheduledPollClose = (from: Date = new Date()) => {
  const { closeHour, closeMinute, closeWeekday, timeZone } = FLAVOR_POLL_SCHEDULE
  const now = getZonedParts(from, timeZone)
  let daysAhead = (closeWeekday - now.weekday + 7) % 7
  const minutesNow = now.hour * 60 + now.minute
  const minutesAtClose = closeHour * 60 + closeMinute

  if (daysAhead === 0 && minutesNow >= minutesAtClose) {
    daysAhead = 7
  }

  const target = new Date(Date.UTC(now.year, now.month - 1, now.day + daysAhead))

  return zonedWallTimeToDate(
    {
      day: target.getUTCDate(),
      hour: closeHour,
      minute: closeMinute,
      month: target.getUTCMonth() + 1,
      year: target.getUTCFullYear(),
    },
    timeZone,
  )
}

export const formatPollCloseLabel = (closesAt: Date | string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: FLAVOR_POLL_SCHEDULE.timeZone,
    timeZoneName: 'short',
    weekday: 'long',
  }).format(new Date(closesAt))

export const formatPollDateLabel = (value: Date | string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: FLAVOR_POLL_SCHEDULE.timeZone,
    timeZoneName: 'short',
    weekday: 'long',
  }).format(new Date(value))
