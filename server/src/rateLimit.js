// Tiny in-memory rate limiter (per IP). Enough to stop a script hammering checkout or search.
// If you ever run several server copies, move this to Redis.
const hits = new Map()

export function rateLimit(name, max, windowMs) {
  return (req, _res, next) => {
    const key = `${name}:${req.ip}`
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= max) {
      return next(Object.assign(new Error('Too many requests. Please wait a moment and try again.'), { status: 429 }))
    }
    recent.push(now)
    hits.set(key, recent)
    next()
  }
}

// forget old entries once an hour, so the Map cannot grow forever
const cleanup = setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000
  for (const [key, times] of hits) {
    const fresh = times.filter((t) => t > cutoff)
    if (fresh.length) hits.set(key, fresh)
    else hits.delete(key)
  }
}, 60 * 60 * 1000)
cleanup.unref?.()
