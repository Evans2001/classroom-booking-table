import type { LecturerAccountRequestStatus } from "@/lib/server/database";
import { listLecturerAccountRequests } from "@/lib/server/database";
import { errorResponse, json, optionsResponse, requireAdminApiAuth } from "@/lib/server/api";

const ACCOUNT_REQUEST_STATUSES = new Set<LecturerAccountRequestStatus | "ALL">([
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as LecturerAccountRequestStatus | "ALL" | null;
  if (status && !ACCOUNT_REQUEST_STATUSES.has(status)) {
    return errorResponse(new Error("Choose a valid account request status."));
  }
  return json(listLecturerAccountRequests(status ?? "ALL"));
}
