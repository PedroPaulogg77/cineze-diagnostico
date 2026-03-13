interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { success: boolean; retryAfterMs: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket) {
    buckets.set(key, { tokens: maxRequests - 1, lastRefill: now })
    return { success: true, retryAfterMs: 0 }
  }

  const elapsed = now - bucket.lastRefill
  const refillRate = maxRequests / windowMs
  bucket.tokens = Math.min(maxRequests, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now

  if (bucket.tokens < 1) {
    const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRate)
    return { success: false, retryAfterMs }
  }

  bucket.tokens -= 1
  return { success: true, retryAfterMs: 0 }
}
