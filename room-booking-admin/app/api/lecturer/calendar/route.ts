import { assertLecturerSession, listAdminCalendarBookings, listTimetableEntries } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";
export function OPTIONS() { return optionsResponse(); }
export function GET(request: Request) {
  try {
    assertLecturerSession(lecturerIdentityFromRequest(request));
    const bookings = listAdminCalendarBookings(new URL(request.url).searchParams.get("month") || "")
      .filter((booking) => booking.status === "APPROVED" || booking.status === "PENDING")
      .map(({ id, roomId, roomName, requesterName, date, startTime, endTime, status }) =>
        ({ id, roomId, roomName, lecturerName: requesterName, date, startTime, endTime, status }));
    return json({ entries: listTimetableEntries(), bookings });
  } catch (error) { return errorResponse(error); }
}
