import type { Context, Next } from "hono";
import { getConfig } from "../config.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function resetRateLimits(): void {
  buckets.clear();
}

export async function rateLimit(c: Context, next: Next) {
  const cfg = getConfig();
  const key = (c.get("apiKey") as string | undefined) ?? c.req.header("x-forwarded-for") ?? "anon";
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + cfg.rateLimitWindowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  c.header("X-RateLimit-Limit", String(cfg.rateLimitMax));
  c.header("X-RateLimit-Remaining", String(Math.max(0, cfg.rateLimitMax - bucket.count)));
  c.header("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > cfg.rateLimitMax) {
    return c.json(
      {
        error: "rate_limit_exceeded",
        message: `Rate limit exceeded. Max ${cfg.rateLimitMax} requests per ${cfg.rateLimitWindowMs}ms.`,
      },
      429,
    );
  }
  await next();
}
