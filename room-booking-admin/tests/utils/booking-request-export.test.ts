import { describe, expect, it } from "vitest";

import { bookingRequestsCsvFilename, bookingRequestsToCsv } from "@/lib/utils/booking-request-export";
import type { BookingRequest } from "@/lib/types/request";

const request: BookingRequest = {
  id: "booking-1",
  requesterName: "Asha Perera",
  requesterEmail: "asha@example.edu",
  department: "Computer Science",
  roomId: "room-1",
  roomName: "Hall, A",
  purpose: "Project \"review\"\nwith panel",
  date: "2026-11-02",
  startTime: "09:00",
  endTime: "10:00",
  attendees: 32,
  status: "APPROVED",
  submittedAt: "2026-11-01T07:30:00.000Z",
  reviewedAt: "2026-11-01T08:00:00.000Z",
  reviewer: "System Admin",
  reviewerNote: "Approved",
};

describe("booking request CSV export", () => {
  it("exports booking review fields and escapes CSV values", () => {
    expect(bookingRequestsToCsv([request])).toBe([
      "Requester name,Requester email,Department,Room,Date,Start time,End time,Attendees,Purpose,Status,Submitted at,Reviewed at,Reviewer,Reviewer note",
      'Asha Perera,asha@example.edu,Computer Science,"Hall, A",2026-11-02,09:00,10:00,32,"Project ""review""\nwith panel",APPROVED,2026-11-01T07:30:00.000Z,2026-11-01T08:00:00.000Z,System Admin,Approved',
    ].join("\r\n"));
  });

  it("uses a date-based download filename", () => {
    expect(bookingRequestsCsvFilename(new Date("2026-11-02T10:00:00.000Z")))
      .toBe("booking-requests-2026-11-02.csv");
  });
});
