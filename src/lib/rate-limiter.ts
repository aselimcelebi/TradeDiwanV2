// Simple rate limiter for broker connections
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const connectionAttempts: Map<string, RateLimitEntry> = new Map();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = connectionAttempts.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First attempt or window has reset
    connectionAttempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Increment counter
  entry.count++;
  return true;
}

export function getRemainingAttempts(identifier: string, maxAttempts: number = 5): number {
  const entry = connectionAttempts.get(identifier);
  if (!entry || Date.now() > entry.resetTime) {
    return maxAttempts;
  }
  return Math.max(0, maxAttempts - entry.count);
}

export function getTimeUntilReset(identifier: string): number {
  const entry = connectionAttempts.get(identifier);
  if (!entry) return 0;
  return Math.max(0, entry.resetTime - Date.now());
}
