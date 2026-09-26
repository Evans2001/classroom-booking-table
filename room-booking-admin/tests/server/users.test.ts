// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/admin/users/route";
import { DELETE } from "@/app/api/admin/users/[id]/route";
import { createAdminSession } from "@/lib/server/admin-auth";
import { authenticateLecturerAccount, listAdminUsers, revokeLecturerSession } from "@/lib/server/database";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

afterEach(() => {
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});
const base = "http://localhost/api/admin/users";
function request(method = "GET", origin?: string) {
  return new Request(base + (method === "DELETE" ? "/lecturer-demo" : ""), {
    method,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${createAdminSession()}`, ...(origin ? { origin } : {}) },
  });
}
describe("admin user management", () => {
  it("requires admin authentication and rejects cross-origin deletion", async () => {
    expect(GET(new Request(base)).status).toBe(401);
    const context = { params: Promise.resolve({ id: "lecturer-demo" }) };
    expect((await DELETE(new Request(base, { method: "DELETE" }), context)).status).toBe(401);
    expect((await DELETE(request("DELETE", "https://other.example"), context)).status).toBe(403);
  });
  it("lists only public account fields", async () => {
    const response = GET(request());
    expect(response.status).toBe(200);
    const users = await response.json();
    expect(users.length).toBeGreaterThan(0);
    expect(Object.keys(users[0]).sort()).toEqual(["id", "name", "gmail", "department", "position", "idNumber", "username", "createdAt"].sort());
  });
  it("deletes access and push tokens, retains records, and returns 404 on repeat", async () => {
    const account = authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123");
    const db = globalThis.__roomBookingDatabase__!;
    const email = listAdminUsers().find((user) => user.id === account.id)!.gmail;
    const bookings = db.prepare("SELECT * FROM booking_requests").all();
    const issues = db.prepare("SELECT * FROM issues").all();
    db.prepare("INSERT INTO lecturer_push_tokens VALUES (?, ?, ?, ?, ?, ?)").run("test-push", email, "test-token", "android", "2026-01-01", "2026-01-01");
    const context = { params: Promise.resolve({ id: account.id }) };
    expect((await DELETE(request("DELETE"), context)).status).toBe(200);
    expect(listAdminUsers().some((user) => user.id === account.id)).toBe(false);
    expect(() => authenticateLecturerAccount(email, "Lecturer@123")).toThrow("Invalid lecturer credentials");
    expect(() => revokeLecturerSession(account.sessionToken!)).toThrow("Invalid lecturer session");
    expect(db.prepare("SELECT * FROM lecturer_sessions WHERE lecturer_account_id = ?").all(account.id)).toHaveLength(0);
    expect(db.prepare("SELECT * FROM lecturer_push_tokens WHERE lecturer_email = ?").all(email)).toHaveLength(0);
    expect(db.prepare("SELECT * FROM booking_requests").all()).toEqual(bookings);
    expect(db.prepare("SELECT * FROM issues").all()).toEqual(issues);
    expect(db.prepare("SELECT value FROM app_settings WHERE key = 'demo_account_deleted'").get()).toEqual({ value: "true" });
    expect((await DELETE(request("DELETE"), context)).status).toBe(404);
  });
});
