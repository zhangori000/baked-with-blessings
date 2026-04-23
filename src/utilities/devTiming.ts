const isDev = process.env.NODE_ENV !== 'production'

export async function measureServerStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev) {
    return fn()
  }

  const startedAt = performance.now()

  try {
    return await fn()
  } finally {
    const durationMs = performance.now() - startedAt
    console.log(`[perf] ${label}: ${durationMs.toFixed(1)}ms`)
  }
}
