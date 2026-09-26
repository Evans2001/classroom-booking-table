import { authenticateLecturerAccount } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import {
  RateLimitError,
  clearRateLimit,
  enforceRateLimit,
  requestRateLimitKey,
} from "@/lib/server/rate-limit";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { identifier?: unknown; password?: unknown };
    const identifier = typeof body.identifier === "string" ? body.identifier : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rateLimitKey = requestRateLimitKey(request, "lecturer-login", identifier);
    enforceRateLimit(rateLimitKey, 10, 15 * 60 * 1_000);
    const account = authenticateLecturerAccount(identifier, password);
    clearRateLimit(rateLimitKey);
    return json(account);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }
    return errorResponse(error, 401);
  }
}
