type AttemptBucket = number[];

declare global {
  var __roomBookingRateLimits__: Map<string, AttemptBucket> | undefined;
}

const buckets = globalThis.__roomBookingRateLimits__ ?? new Map<string, AttemptBucket>();
globalThis.__roomBookingRateLimits__ = buckets;
const MAX_TRACKED_BUCKETS = 10_000;

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many attempts. Please wait and try again.");
  }
}

export function requestRateLimitKey(
  request: Request,
  scope: string,
  subject = "",
): string {
  const forwardedAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address =
    forwardedAddress || request.headers.get("x-real-ip")?.trim() || "unknown-client";
  return `${scope}:${address.slice(0, 128)}:${subject.trim().toLowerCase().slice(0, 254)}`;
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMilliseconds: number,
  now = Date.now(),
): void {
  if (!buckets.has(key) && buckets.size >= MAX_TRACKED_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (oldestKey) buckets.delete(oldestKey);
  }
  const cutoff = now - windowMilliseconds;
  const recentAttempts = (buckets.get(key) ?? []).filter((attempt) => attempt > cutoff);
  if (recentAttempts.length >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((recentAttempts[0] + windowMilliseconds - now) / 1_000),
    );
    buckets.set(key, recentAttempts);
    throw new RateLimitError(retryAfterSeconds);
  }
  recentAttempts.push(now);
  buckets.set(key, recentAttempts);
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
