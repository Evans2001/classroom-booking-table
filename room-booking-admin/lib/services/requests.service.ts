import type { BookingRequest, RequestFilters, RequestStatus } from "@/lib/types/request";
import { apiGet, apiSend } from "@/lib/services/api-client";

export async function listRequests(filters?: RequestFilters): Promise<BookingRequest[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  return apiGet<BookingRequest[]>(`/api/admin/requests${query ? `?${query}` : ""}`);
}

export async function getRequestById(id: string): Promise<BookingRequest | undefined> {
  const requests = await listRequests();
  return requests.find((request) => request.id === id);
}

export async function decideRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<BookingRequest> {
  return apiSend<BookingRequest>(`/api/admin/requests/${id}/decision`, "POST", { decision, note });
}

export interface ImportedRow {
  requesterName: string;
  requesterEmail: string;
  department: string;
  roomId: string;
  purpose: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
}

export async function createImportedRequests(rows: ImportedRow[]): Promise<BookingRequest[]> {
  return apiSend<BookingRequest[]>("/api/admin/requests/import", "POST", { rows });
}

export async function countRequestsByStatus(status: RequestStatus): Promise<number> {
  const requests = await listRequests({ status });
  return requests.length;
}

export function __resetRequestsService(): void {
  // Database-backed service: no-op retained for backward compatibility.
}
