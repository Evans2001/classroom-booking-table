import {
  createAdminSession,
  createAdminSessionCookie,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from "@/lib/server/admin-auth";
import {
  RateLimitError,
  clearRateLimit,
  enforceRateLimit,
  requestRateLimitKey,
} from "@/lib/server/rate-limit";

export async function POST(request: Request): Promise<Response> {
  if (!isAdminAuthConfigured()) {
    return Response.json(
      { error: "Admin authentication is not configured on this server." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rateLimitKey = requestRateLimitKey(request, "admin-login", email);
    enforceRateLimit(rateLimitKey, 5, 15 * 60 * 1_000);
    if (!validateAdminCredentials(email, password)) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    clearRateLimit(rateLimitKey);
    const token = createAdminSession();
    return Response.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": createAdminSessionCookie(token),
        },
      },
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { error: error.message },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(error.retryAfterSeconds),
          },
        },
      );
    }
    return Response.json(
      { error: "Enter a valid email and password." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
