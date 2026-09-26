import {
  AUTH_COOKIE_NAME,
  LECTURER_SESSION_STORAGE_KEYS,
  isValidLecturerSessionToken,
} from "@/lib/utils/constants";

const API_BASE = process.env.NEXT_PUBLIC_ROOM_BOOKING_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
let redirectingToLogin = false;

async function recoverFromExpiredSession(): Promise<void> {
  if (typeof window === "undefined" || redirectingToLogin) return;
  redirectingToLogin = true;
  for (const key of LECTURER_SESSION_STORAGE_KEYS) {
    sessionStorage.removeItem(key);
  }
  try {
    await fetch("/api/lecturer/auth/logout", { method: "POST" });
  } finally {
    window.location.replace("/login?sessionExpired=1");
  }
}

async function parseResponse<T>(response: Response, redirectOnUnauthorized = true): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Ignore non-JSON bodies.
    }
    if (response.status === 401 && redirectOnUnauthorized) {
      await recoverFromExpiredSession();
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

function mergeHeaders(...sources: (HeadersInit | undefined)[]): Headers {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

function lecturerProxyHeaders(source?: HeadersInit): HeadersInit {
  if (!source) {
    return {};
  }

  const incoming = new Headers(source);
  const cookieHeader = incoming.get("cookie");
  const sessionToken = cookieHeader
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === AUTH_COOKIE_NAME)
    ?.slice(1)
    .join("=");

  if (isValidLecturerSessionToken(sessionToken)) {
    return { Authorization: `Bearer ${sessionToken}` };
  }

  const authorization = incoming.get("authorization");
  return authorization ? { Authorization: authorization } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
  });
  return parseResponse<T>(response, !path.includes("/auth/login"));
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response, !path.includes("/auth/login"));
}

export async function proxyToBackend(path: string, init?: RequestInit): Promise<Response> {
  const upstream = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: mergeHeaders(lecturerProxyHeaders(init?.headers), { "Content-Type": "application/json" }),
    cache: "no-store",
  });
  const bodyText = await upstream.text();
  return new Response(bodyText, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
