import { apiGet, apiSend } from "@/lib/services/api-client";
import type { LecturerAccountRequest, LecturerAccountRequestStatus } from "@/lib/types/account-request";

export async function listAccountRequests(
  status: LecturerAccountRequestStatus | "ALL" = "ALL",
): Promise<LecturerAccountRequest[]> {
  const params = new URLSearchParams();
  params.set("status", status);
  return apiGet<LecturerAccountRequest[]>(`/api/admin/account-requests?${params.toString()}`);
}

export async function decideAccountRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<LecturerAccountRequest> {
  return apiSend<LecturerAccountRequest>(`/api/admin/account-requests/${id}/decision`, "POST", {
    decision,
    note,
  });
}
