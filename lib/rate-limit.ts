// Limitador de Requisições simples em memória (LRU básico)
// Atenção: Em ambientes Serverless/Edge (Vercel), esse cache pode ser reiniciado
// caso o container do Edge Node seja reciclado. No entanto, é suficiente para
// conter picos de SPAM massivos (Email Bombing).

interface RateLimitTracker {
  count: number
  expiresAt: number
}

const rateLimitCache = new Map<string, RateLimitTracker>()

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): { success: boolean } {
  const now = Date.now()
  const record = rateLimitCache.get(ip)

  if (!record) {
    rateLimitCache.set(ip, { count: 1, expiresAt: now + windowMs })
    return { success: true }
  }

  // Se o tempo expirou, reseta
  if (now > record.expiresAt) {
    rateLimitCache.set(ip, { count: 1, expiresAt: now + windowMs })
    return { success: true }
  }

  // Se passou do limite, bloqueia
  if (record.count >= limit) {
    return { success: false }
  }

  // Incrementa a contagem
  record.count++
  return { success: true }
}

// Limpeza periódica do cache para não estourar a memória do Serverless
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitCache.entries()) {
    if (now > record.expiresAt) {
      rateLimitCache.delete(ip)
    }
  }
}, 60 * 1000)
