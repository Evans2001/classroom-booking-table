import { createLecturerAccountRequest } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import {
  RateLimitError,
  enforceRateLimit,
  requestRateLimitKey,
} from "@/lib/server/rate-limit";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    enforceRateLimit(requestRateLimitKey(request, "lecturer-account-request"), 5, 60 * 60 * 1_000);
    const body = await request.json();
    return json(createLecturerAccountRequest(body), { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }
    return errorResponse(error);
  }
}
