import { describe, expect, it } from "vitest";

import {
  RateLimitError,
  clearRateLimit,
  enforceRateLimit,
  requestRateLimitKey,
} from "@/lib/server/rate-limit";

describe("request rate limiting", () => {
  it("keys attempts by scope, client address, and normalized subject", () => {
    const request = new Request("http://localhost/login", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(requestRateLimitKey(request, "login", " User@Example.edu ")).toBe(
      "login:203.0.113.7:user@example.edu",
    );
  });

  it("blocks attempts within the window and permits them after it expires", () => {
    const key = "test:rate-limit:unique";
    clearRateLimit(key);
    enforceRateLimit(key, 2, 1_000, 1_000);
    enforceRateLimit(key, 2, 1_000, 1_100);
    expect(() => enforceRateLimit(key, 2, 1_000, 1_200)).toThrow(RateLimitError);
    expect(() => enforceRateLimit(key, 2, 1_000, 2_101)).not.toThrow();
    clearRateLimit(key);
  });
});
