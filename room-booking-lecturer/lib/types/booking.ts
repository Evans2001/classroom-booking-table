export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Booking {
  id: string;
  requesterName: string;
  roomId: string;
  roomName: string;
  building: string;
  roomCode: string;
  startAt: string;
  endAt: string;
  purpose: string;
  attendees: number;
  status: BookingStatus;
  submittedAt: string;
  reviewerNote?: string;
}

export interface BookingInput {
  roomId: string;
  startAt: string;
  endAt: string;
  purpose: string;
  attendees: number;
}

export interface AvailabilityResult {
  available: boolean;
  message: string;
}
