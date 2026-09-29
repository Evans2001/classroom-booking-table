// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateLecturerAccount, createLecturerAccountRequest, decideLecturerAccountRequest, listAdminUsers } from "@/lib/server/database";

afterEach(() => {
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});
const input = (gmail: string) => ({ name: "Same Name", department: "Engineering", position: "Lecturer", gmail });

describe("generated lecturer IDs", () => {
  it("assigns 001 to the existing demo lecturer and sequential IDs ignoring client input", () => {
    expect(listAdminUsers()[0].idNumber).toBe("001");
    expect(createLecturerAccountRequest({ ...input("first@gmail.com"), idNumber: "999" }).idNumber).toBe("002");
    expect(createLecturerAccountRequest(input("second@gmail.com")).idNumber).toBe("003");
  });
  it("does not consume IDs for invalid or duplicate requests, or reuse deleted requests", () => {
    expect(() => createLecturerAccountRequest(input("invalid"))).toThrow("Gmail");
    const first = createLecturerAccountRequest(input("first@gmail.com"));
    expect(() => createLecturerAccountRequest(input("first@gmail.com"))).toThrow("waiting");
    globalThis.__roomBookingDatabase__!.prepare("DELETE FROM lecturer_account_requests WHERE id = ?").run(first.id);
    expect(createLecturerAccountRequest(input("second@gmail.com")).idNumber).toBe("003");
  });
  it("preserves the assigned ID through approval and login", async () => {
    const request = createLecturerAccountRequest(input("approved@gmail.com"));
    await decideLecturerAccountRequest(request.id, "APPROVED");
    expect(listAdminUsers().find((user) => user.gmail === request.gmail)?.idNumber).toBe(request.idNumber);
    expect(authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123").idNumber).toBe("001");
  });
  it("issues 999 then rejects further registrations without storing a request", () => {
    listAdminUsers();
    const db = globalThis.__roomBookingDatabase__!;
    db.prepare("INSERT INTO lecturer_id_registry VALUES (998, 'previous')").run();
    expect(createLecturerAccountRequest(input("last@gmail.com")).idNumber).toBe("999");
    expect(() => createLecturerAccountRequest(input("overflow@gmail.com"))).toThrow("001 to 999");
    expect(db.prepare("SELECT id FROM lecturer_account_requests WHERE gmail = 'overflow@gmail.com'").get()).toBeUndefined();
  });
  it("migrates legacy account and linked request IDs once without breaking sessions", async () => {
    const request = createLecturerAccountRequest(input("legacy@gmail.com"));
    await decideLecturerAccountRequest(request.id, "APPROVED");
    const session = authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123");
    const db = globalThis.__roomBookingDatabase__!;
    db.prepare("UPDATE lecturer_accounts SET id_number = 'EMP-OLD' WHERE request_id = ?").run(request.id);
    db.prepare("UPDATE lecturer_account_requests SET id_number = 'EMP-OLD' WHERE id = ?").run(request.id);
    db.exec("DELETE FROM app_settings WHERE key = 'lecturer_ids_v1'; DELETE FROM lecturer_id_registry;");
    vi.resetModules();
    const reloaded = await import("@/lib/server/database");
    const users = reloaded.listAdminUsers();
    const migrated = users.find((user) => user.gmail === request.gmail)!;
    expect(migrated.idNumber).toBe("002");
    expect(db.prepare("SELECT id_number FROM lecturer_account_requests WHERE id = ?").get(request.id)).toEqual({ id_number: "002" });
    expect(listAdminUsers()).toEqual(users);
    expect(db.prepare("SELECT lecturer_account_id FROM lecturer_sessions WHERE token = ?").get(session.sessionToken!)).toEqual({ lecturer_account_id: session.id });
  });
});
