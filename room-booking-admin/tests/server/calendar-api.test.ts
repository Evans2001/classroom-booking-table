// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/admin/calendar/route";
import { createAdminSession } from "@/lib/server/admin-auth";
import { getDatabase, listAdminRooms } from "@/lib/server/database";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";
afterEach(() => { globalThis.__roomBookingDatabase__?.close(); globalThis.__roomBookingDatabase__ = undefined; });
function request(month = "2026-02", etag?: string) {
  return new Request(`http://localhost/api/admin/calendar?month=${month}`, { headers: { cookie: `${AUTH_COOKIE_NAME}=${createAdminSession()}`, ...(etag ? { "if-none-match": etag } : {}) } });
}
describe("efficient calendar snapshot", () => {
  it("requires authentication even for conditional requests and validates months", () => {
    expect(GET(new Request("http://localhost/api/admin/calendar?month=2026-02")).status).toBe(401);
    expect(GET(request("2026-13")).status).toBe(400);
  });
  it("returns 304 only for unchanged data, with private cache policy and public lecturer fields", async () => {
    const response = GET(request());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private");
    expect(Object.keys(data.lecturers[0]).sort()).toEqual(["idNumber", "name"]);
    const etag = response.headers.get("etag")!;
    const unchanged = GET(request("2026-02", etag));
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe("");
    getDatabase().prepare("UPDATE rooms SET name = 'Changed room' WHERE id = ?").run(data.rooms[0].id);
    expect(GET(request("2026-02", etag)).status).toBe(200);
  });
  it("uses campus month boundaries and does not return another month's history", async () => {
    const db = getDatabase();
    const room = listAdminRooms()[0];
    db.exec("DELETE FROM booking_requests");
    const insert = db.prepare(`INSERT INTO booking_requests (id, requester_name, requester_email, department, room_id, purpose, start_at, end_at, attendees, status, submitted_at) VALUES (?, 'Lecturer', 'test@gmail.com', 'Engineering', ?, 'Test', ?, ?, 1, 'APPROVED', '2026-01-01')`);
    insert.run("before", room.id, "2026-01-31T18:29:00.000Z", "2026-01-31T18:30:00.000Z");
    insert.run("inside", room.id, "2026-01-31T18:30:00.000Z", "2026-01-31T19:30:00.000Z");
    insert.run("after", room.id, "2026-02-28T18:30:00.000Z", "2026-02-28T19:30:00.000Z");
    const data = await GET(request()).json();
    expect(data.bookings.map((booking: { id: string }) => booking.id)).toEqual(["inside"]);
    const exec = vi.spyOn(db, "exec");
    getDatabase(); listAdminRooms(); getDatabase();
    expect(exec).not.toHaveBeenCalled();
    exec.mockRestore();
  });
});
