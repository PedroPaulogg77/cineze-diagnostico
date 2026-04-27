import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// 1. Configuração do Redis (Opcional - Ativa se as ENVs existirem)
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// 2. Limitador Upstash (Algoritmo Token Bucket)
const upstashRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(5, "15 m", 5), // 5 tokens a cada 15 min
      analytics: true,
      prefix: "ratelimit:cineze",
    })
  : null

// 3. Fallback em Memória (LRU básico)
interface RateLimitTracker {
  count: number
  expiresAt: number
}
const memoryCache = new Map<string, RateLimitTracker>()

export async function checkRateLimit(
  ip: string, 
  limit: number = 5, 
  windowMs: number = 15 * 60 * 1000
): Promise<{ success: boolean }> {
  
  // A. Tentar via Redis (Enterprise)
  if (upstashRateLimit) {
    try {
      const { success } = await upstashRateLimit.limit(ip)
      return { success }
    } catch (err) {
      console.error("[ratelimit] Erro no Redis, usando fallback de memória:", err)
    }
  }

  // B. Fallback em Memória (Standard)
  const now = Date.now()
  const record = memoryCache.get(ip)

  if (!record || now > record.expiresAt) {
    memoryCache.set(ip, { count: 1, expiresAt: now + windowMs })
    return { success: true }
  }

  if (record.count >= limit) {
    return { success: false }
  }

  record.count++
  return { success: true }
}

// Limpeza do cache de memória
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    memoryCache.forEach((record, ip) => {
      if (now > record.expiresAt) memoryCache.delete(ip)
    })
  }, 60 * 1000)
}
