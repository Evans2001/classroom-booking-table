import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createAdminSession,
  createAdminSessionCookie,
  isValidAdminSession,
  validateAdminCredentials,
} from "@/lib/server/admin-auth";
import { requireAdminApiAuth } from "@/lib/server/api";
import { AUTH_COOKIE_NAME, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/utils/constants";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin authentication", () => {
  it("accepts local demo credentials only when both values match", () => {
    expect(validateAdminCredentials(DEMO_ADMIN_EMAIL.toUpperCase(), DEMO_ADMIN_PASSWORD)).toBe(true);
    expect(validateAdminCredentials(DEMO_ADMIN_EMAIL, "wrong-password")).toBe(false);
  });

  it("creates expiring, tamper-resistant sessions", () => {
    const now = Date.UTC(2026, 8, 10, 8);
    const token = createAdminSession(now);

    expect(isValidAdminSession(token, now)).toBe(true);
    expect(isValidAdminSession(`${token.slice(0, -1)}0`, now)).toBe(false);
    expect(isValidAdminSession(token, now + 8 * 60 * 60 * 1_000)).toBe(false);
  });

  it("marks the session cookie HttpOnly and SameSite", () => {
    const cookie = createAdminSessionCookie(createAdminSession());

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
  });

  it("requires explicit production credentials and marks production cookies secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect(validateAdminCredentials(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)).toBe(false);
    expect(() => createAdminSession()).toThrow("not configured");

    vi.stubEnv("ADMIN_EMAIL", "secure-admin@example.edu");
    vi.stubEnv("ADMIN_PASSWORD", "a-long-production-password");
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-production-session-secret-with-at-least-32-characters");
    expect(validateAdminCredentials("secure-admin@example.edu", "a-long-production-password")).toBe(true);
    expect(createAdminSessionCookie(createAdminSession())).toContain("Secure");
  });

  it("rejects unauthenticated and cross-origin admin API calls", async () => {
    const unauthenticated = requireAdminApiAuth(new Request("http://localhost/api/admin/rooms"));
    expect(unauthenticated?.status).toBe(401);

    const token = createAdminSession();
    const crossOrigin = requireAdminApiAuth(new Request("http://localhost/api/admin/rooms", {
      method: "POST",
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${token}`,
        origin: "https://attacker.example",
      },
    }));
    expect(crossOrigin?.status).toBe(403);

    const authenticated = requireAdminApiAuth(new Request("http://localhost/api/admin/rooms", {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    }));
    expect(authenticated).toBeUndefined();
  });
});
