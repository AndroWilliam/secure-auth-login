interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  blockDurationMs: number
}

interface RateLimitRecord {
  attempts: number
  firstAttempt: number
  blockedUntil?: number
}

// In-memory store for demo - in production use Redis or database
const rateLimitStore = new Map<string, RateLimitRecord>()

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: number }> {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    // Clean up expired records
    this.cleanup()

    if (!record) {
      // First attempt
      rateLimitStore.set(identifier, {
        attempts: 1,
        firstAttempt: now,
      })
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
      }
    }

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockedUntil,
      }
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.config.windowMs) {
      // Reset window
      rateLimitStore.set(identifier, {
        attempts: 1,
        firstAttempt: now,
      })
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
      }
    }

    // Increment attempts
    record.attempts++

    if (record.attempts > this.config.maxAttempts) {
      // Block the identifier
      record.blockedUntil = now + this.config.blockDurationMs
      rateLimitStore.set(identifier, record)
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockedUntil,
      }
    }

    rateLimitStore.set(identifier, record)
    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - record.attempts,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (
        (record.blockedUntil && now > record.blockedUntil) ||
        (!record.blockedUntil && now - record.firstAttempt > this.config.windowMs)
      ) {
        rateLimitStore.delete(key)
      }
    }
  }
}

// Pre-configured rate limiters
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
})

export const otpRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxAttempts: 3,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
})

export const signupRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
  blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
})
