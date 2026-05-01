export const parseEmailRecipients = (value?: null | string) => {
  const seen = new Set<string>()

  return (value || '')
    .split(/[,;\n]+/)
    .map((recipient) => recipient.trim())
    .filter((recipient) => {
      if (!recipient) return false

      const key = recipient.toLowerCase()
      if (seen.has(key)) return false

      seen.add(key)
      return true
    })
}

export const getFirstConfiguredEmailRecipients = (...values: Array<null | string | undefined>) => {
  for (const value of values) {
    const recipients = parseEmailRecipients(value)

    if (recipients.length) {
      return recipients
    }
  }

  return []
}
