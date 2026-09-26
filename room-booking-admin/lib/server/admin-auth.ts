import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_SECONDS,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/utils/constants";

const SESSION_VERSION = "v1";
const LOCAL_DEVELOPMENT_SESSION_SECRET =
  "local-room-booking-admin-session-secret-do-not-use-in-production";

function safeEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function getSessionSecret(): string | undefined {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? undefined
    : LOCAL_DEVELOPMENT_SESSION_SECRET;
}

function getAdminCredentials(): { email: string; password: string } | undefined {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) return { email: email.toLowerCase(), password };
  if (process.env.NODE_ENV === "production") return undefined;
  return { email: DEMO_ADMIN_EMAIL.toLowerCase(), password: DEMO_ADMIN_PASSWORD };
}

function signSessionPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getSessionSecret() && getAdminCredentials());
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const credentials = getAdminCredentials();
  if (!credentials) return false;
  return safeEqual(email.trim().toLowerCase(), credentials.email) && safeEqual(password, credentials.password);
}

export function createAdminSession(now = Date.now()): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Admin authentication is not configured.");

  const expiresAt = Math.floor(now / 1000) + AUTH_MAX_AGE_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  return `${payload}.${signSessionPayload(payload, secret)}`;
}

export function isValidAdminSession(value: string | undefined, now = Date.now()): boolean {
  const secret = getSessionSecret();
  if (!secret || !value) return false;

  const [version, rawExpiresAt, suppliedSignature, ...extra] = value.split(".");
  if (
    extra.length > 0
    || version !== SESSION_VERSION
    || !/^\d+$/.test(rawExpiresAt ?? "")
    || !/^[a-f\d]{64}$/i.test(suppliedSignature ?? "")
  ) {
    return false;
  }

  const expiresAt = Number(rawExpiresAt);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const payload = `${version}.${rawExpiresAt}`;
  const expectedSignature = signSessionPayload(payload, secret);
  return safeEqual(suppliedSignature, expectedSignature);
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function isAuthenticatedAdminRequest(request: Request): boolean {
  return isValidAdminSession(readCookie(request.headers.get("cookie"), AUTH_COOKIE_NAME));
}

export function createAdminSessionCookie(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${AUTH_MAX_AGE_SECONDS}${secure}`;
}

export function createExpiredAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
