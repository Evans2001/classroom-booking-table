// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/lecturer/calendar/route";
import { authenticateLecturerAccount, getDatabase, listAdminRooms } from "@/lib/server/database";
afterEach(() => { globalThis.__roomBookingDatabase__?.close(); globalThis.__roomBookingDatabase__ = undefined; });
describe("shared lecturer calendar", () => {
  it("requires a lecturer session", () => { expect(GET(new Request("http://localhost/api/lecturer/calendar?month=2026-09")).status).toBe(401); });
  it("shows other lecturers' active bookings without private request data or rejected bookings", async () => {
    const account = authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123");
    const db = getDatabase();
    const room = listAdminRooms()[0];
    db.exec("DELETE FROM booking_requests");
    const insert = db.prepare(`INSERT INTO booking_requests (id, requester_name, requester_email, department, room_id, purpose, start_at, end_at, attendees, status, submitted_at) VALUES (?, 'Other lecturer', 'private@gmail.com', 'Civil', ?, 'Private purpose', '2026-09-15T04:30:00.000Z', '2026-09-15T05:30:00.000Z', 10, ?, '2026-09-01')`);
    for (const status of ['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED']) insert.run(status, room.id, status);
    const response = GET(new Request("http://localhost/api/lecturer/calendar?month=2026-09", { headers: { authorization: `Bearer ${account.sessionToken}` } }));
    const data = await response.json();
    expect(data.bookings.map((booking: { status: string }) => booking.status).sort()).toEqual(['APPROVED','PENDING']);
    expect(data.bookings[0].lecturerName).toBe('Other lecturer');
    expect(data.bookings[0].roomName).toBe(room.name);
    expect(JSON.stringify(data)).not.toContain('private@gmail.com');
    expect(JSON.stringify(data)).not.toContain('Private purpose');
  });
});
