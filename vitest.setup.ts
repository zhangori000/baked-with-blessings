// Any setup scripts you might need go here

// Load env files like Next does (.env.local first, then .env) so tests that
// boot Payload find PAYLOAD_SECRET / DATABASE_URL. Uses Node's built-in
// loader; @next/env is unsuitable here because it skips .env.local whenever
// NODE_ENV === 'test', which is exactly what vitest sets.
for (const envFile of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(envFile)
  } catch {
    // File may not exist; that's fine.
  }
}
