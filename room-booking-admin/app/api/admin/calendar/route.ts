import { createHash } from "node:crypto";
import { listAdminCalendarBookings, listAdminRooms, listAdminUsers, listTimetableEntries } from "@/lib/server/database";
import { errorResponse, requireAdminApiAuth } from "@/lib/server/api";
export function GET(request: Request): Response {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;
  try {
    const bookings = listAdminCalendarBookings(new URL(request.url).searchParams.get("month") || "");
    const body = JSON.stringify({ entries: listTimetableEntries(),
      rooms: listAdminRooms().map(({ id, roomNumber, name, status }) => ({ id, roomNumber, name, status })),
      lecturers: listAdminUsers().map(({ idNumber, name }) => ({ idNumber, name })), bookings });
    const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
    const headers = { "Content-Type": "application/json", "Cache-Control": "private, no-cache", ETag: etag, Vary: "Cookie" };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    return new Response(body, { headers });
  } catch (error) { return errorResponse(error); }
}
