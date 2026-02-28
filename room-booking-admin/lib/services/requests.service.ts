import { requestsMock } from "@/lib/data/requests.mock";
import { DEMO_ADMIN_NAME } from "@/lib/utils/constants";
import type { BookingRequest, RequestFilters, RequestStatus } from "@/lib/types/request";

let requestsData: BookingRequest[] = [...requestsMock];

const LATENCY_MS = 120;

const delay = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, LATENCY_MS);
  });

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean =>
  Math.max(toMinutes(aStart), toMinutes(bStart)) < Math.min(toMinutes(aEnd), toMinutes(bEnd));

export async function listRequests(filters?: RequestFilters): Promise<BookingRequest[]> {
  await delay();
  let filtered = [...requestsData];

  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((request) => request.status === filters.status);
  }
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      (request) =>
        request.requesterName.toLowerCase().includes(query) ||
        request.department.toLowerCase().includes(query) ||
        request.purpose.toLowerCase().includes(query),
    );
  }
  return filtered.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export async function getRequestById(id: string): Promise<BookingRequest | undefined> {
  await delay();
  return requestsData.find((request) => request.id === id);
}

export async function decideRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<BookingRequest> {
  await delay();
  const index = requestsData.findIndex((request) => request.id === id);
  if (index === -1) {
    throw new Error("Request not found");
  }
  const current = requestsData[index];
  if (current.status !== "PENDING") {
    throw new Error("Only pending requests can be reviewed");
  }

  if (decision === "REJECTED" && !note?.trim()) {
    throw new Error("Rejection note is required");
  }

  if (decision === "APPROVED") {
    const conflictingApproved = requestsData.find(
      (request) =>
        request.id !== current.id &&
        request.status === "APPROVED" &&
        request.roomId === current.roomId &&
        request.date === current.date &&
        overlaps(request.startTime, request.endTime, current.startTime, current.endTime),
    );

    if (conflictingApproved) {
      throw new Error("Time conflict with an existing approved booking");
    }
  }

  const updated: BookingRequest = {
    ...current,
    status: decision,
    reviewer: DEMO_ADMIN_NAME,
    reviewerNote: note?.trim() || "Reviewed",
    reviewedAt: new Date().toISOString(),
  };
  requestsData[index] = updated;
  return updated;
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
  await delay();
  const now = new Date().toISOString();
  const created = rows.map<BookingRequest>((row, index) => ({
    id: `req-import-${Date.now()}-${index}`,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    department: row.department,
    roomId: row.roomId,
    purpose: row.purpose,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    attendees: row.attendees,
    status: "PENDING",
    submittedAt: now,
  }));

  requestsData = [...created, ...requestsData];
  return created;
}

export async function countRequestsByStatus(status: RequestStatus): Promise<number> {
  await delay();
  return requestsData.filter((request) => request.status === status).length;
}

export function __resetRequestsService(): void {
  requestsData = [...requestsMock];
}
