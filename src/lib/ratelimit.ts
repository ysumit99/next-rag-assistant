// Rate limiting via Upstash Redis
// Uses sliding window algorithm for accurate limiting
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy init — only created when first needed
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Chat: 20 requests per hour per IP
export const chatRatelimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "rag:chat",
});

// Ingest: 5 uploads per hour per IP
export const ingestRatelimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rag:ingest",
});

// Helper to extract IP from request
export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

// Helper to return a clean 429 response
export function rateLimitResponse(remaining: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait before trying again.",
      retryAfter: "1 hour",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remaining.toString(),
        "Retry-After": "3600",
      },
    }
  );
}
