export const explainAdminError = (message: string) => {
  const lower = message.toLowerCase()

  if (lower.includes('missing secret') || lower.includes('payload_secret')) {
    return 'This preview is missing PAYLOAD_SECRET. Add a preview-only secret in Vercel. Do not copy production values into a public chat.'
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('connection') ||
    lower.includes('database_url') ||
    lower.includes('enotfound') ||
    lower.includes('connect timeout')
  ) {
    return 'This preview cannot reach its own database. Set a preview Neon/DATABASE_URL. Do not point preview at production.'
  }

  if (lower.includes('does not exist') || lower.includes('relation') || lower.includes('42p01')) {
    return 'This preview database is missing tables. Run preview migrations only. Do not migrate or write the production database.'
  }

  if (lower.includes('missing from the client config') || lower.includes('is hidden, so login')) {
    return 'The admin login config is incomplete. The admins collection must stay visible to Payload. This is a preview code issue, not a reason to use the production database.'
  }

  return 'The admin route threw before a login form could render. The technical message is below.'
}
