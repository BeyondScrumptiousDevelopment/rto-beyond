/**
 * Counts failed password attempts per visitor (by IP) and blocks further
 * attempts for a while once the limit is reached.
 *
 * Counts live in the memory of each Cloudflare edge instance, so this is a
 * brake on guessing rather than a global guarantee — it makes brute-forcing
 * the test-site password impractical without needing a paid add-on.
 */
export class FailureLimiter {
  private readonly entries = new Map<string, { failures: number; resetAt: number }>()

  constructor(
    private readonly maxFailures = 10,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly maxKeys = 10_000,
  ) {}

  /** Seconds until the visitor may try again, or 0 if not blocked. */
  retryAfter(key: string, now = Date.now()): number {
    const entry = this.entries.get(key)
    if (!entry) return 0
    if (now >= entry.resetAt) {
      this.entries.delete(key)
      return 0
    }
    return entry.failures >= this.maxFailures ? Math.ceil((entry.resetAt - now) / 1000) : 0
  }

  recordFailure(key: string, now = Date.now()): void {
    const entry = this.entries.get(key)
    if (entry && now < entry.resetAt) {
      entry.failures++
      return
    }
    if (this.entries.size >= this.maxKeys) this.prune(now)
    this.entries.set(key, { failures: 1, resetAt: now + this.windowMs })
  }

  reset(key: string): void {
    this.entries.delete(key)
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) if (now >= entry.resetAt) this.entries.delete(key)
    // Still full: drop the oldest entries rather than grow without bound.
    while (this.entries.size >= this.maxKeys) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }
}
