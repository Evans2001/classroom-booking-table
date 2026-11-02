import type { BookingRequest } from "@/lib/types/request";

const CSV_HEADERS = [
  "Requester name",
  "Requester email",
  "Department",
  "Room",
  "Date",
  "Start time",
  "End time",
  "Attendees",
  "Purpose",
  "Status",
  "Submitted at",
  "Reviewed at",
  "Reviewer",
  "Reviewer note",
];

function escapeCsvValue(value: string | number | undefined): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function bookingRequestsToCsv(requests: BookingRequest[]): string {
  const rows = requests.map((request) => [
    request.requesterName,
    request.requesterEmail,
    request.department,
    request.roomName ?? request.roomId,
    request.date,
    request.startTime,
    request.endTime,
    request.attendees,
    request.purpose,
    request.status,
    request.submittedAt,
    request.reviewedAt,
    request.reviewer,
    request.reviewerNote,
  ].map(escapeCsvValue).join(","));

  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

export function bookingRequestsCsvFilename(date = new Date()): string {
  return `booking-requests-${date.toISOString().slice(0, 10)}.csv`;
}
