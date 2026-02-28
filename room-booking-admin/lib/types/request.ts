export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface BookingRequest {
  id: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  roomId: string;
  purpose: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  status: RequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewerNote?: string;
}

export interface RequestFilters {
  search?: string;
  status?: RequestStatus | "ALL";
}
