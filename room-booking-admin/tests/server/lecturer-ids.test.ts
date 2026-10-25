// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateLecturerAccount, createLecturerAccountRequest, decideLecturerAccountRequest, listAdminUsers, listAdminRooms, importTimetableEntries } from "@/lib/server/database";

afterEach(() => {
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});
const input = (gmail: string) => ({ name: "Same Name", department: "Electrical and Information Engineering", position: "Lecturer", gmail });

describe("generated lecturer IDs", () => {
  it("keeps existing IDs and assigns independent department sequences ignoring client input", () => {
    expect(listAdminUsers()[0].idNumber).toBe("001");
    expect(createLecturerAccountRequest({ ...input("first@gmail.com"), idNumber: "999" }).idNumber).toBe("EIE001");
    expect(createLecturerAccountRequest(input("second@gmail.com")).idNumber).toBe("EIE002");
    for (const [department, prefix] of [["Civil Engineering", "CE"], ["Mechanical and Manufacturing Engineering", "MME"], ["Marine and Naval Architecture", "MNAE"]]) {
      expect(createLecturerAccountRequest({ ...input(`${prefix.toLowerCase()}@gmail.com`), department }).idNumber).toBe(`${prefix}001`);
    }
  });
  it("does not consume IDs for invalid or duplicate requests, or reuse deleted requests", () => {
    expect(() => createLecturerAccountRequest(input("invalid"))).toThrow("Gmail");
    const first = createLecturerAccountRequest(input("first@gmail.com"));
    expect(() => createLecturerAccountRequest(input("first@gmail.com"))).toThrow("waiting");
    globalThis.__roomBookingDatabase__!.prepare("DELETE FROM lecturer_account_requests WHERE id = ?").run(first.id);
    expect(createLecturerAccountRequest(input("second@gmail.com")).idNumber).toBe("EIE002");
  });
  it("preserves the assigned ID through approval and login", async () => {
    const request = createLecturerAccountRequest(input("approved@gmail.com"));
    await decideLecturerAccountRequest(request.id, "APPROVED");
    expect(listAdminUsers().find((user) => user.gmail === request.gmail)?.idNumber).toBe(request.idNumber);
    const entry = importTimetableEntries([{ semester: "S1", department: request.department, batch: "2026", lecturerId: request.idNumber, roomNumber: listAdminRooms()[0].roomNumber, dayOfWeek: "Monday", startTime: "08:00", endTime: "09:00", moduleCode: "EE101", lecturerName: "Ignored" }])[0];
    expect(entry.lecturerId).toBe("EIE001");
    expect(entry.lecturerName).toBe(request.name);
    expect(authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123").idNumber).toBe("001");
  });
  it("issues 999 then rejects further registrations without storing a request", () => {
    listAdminUsers();
    const db = globalThis.__roomBookingDatabase__!;
    db.prepare("INSERT INTO department_lecturer_id_registry VALUES ('EIE', 998, 'previous')").run();
    expect(createLecturerAccountRequest(input("last@gmail.com")).idNumber).toBe("EIE999");
    expect(() => createLecturerAccountRequest(input("overflow@gmail.com"))).toThrow("EIE001 to EIE999");
    expect(createLecturerAccountRequest({ ...input("civil@gmail.com"), department: "Civil Engineering" }).idNumber).toBe("CE001");
    expect(db.prepare("SELECT id FROM lecturer_account_requests WHERE gmail = 'overflow@gmail.com'").get()).toBeUndefined();
  });
  it("rejects unknown departments without consuming an ID", () => {
    expect(() => createLecturerAccountRequest({ ...input("unknown@gmail.com"), department: "Other" })).toThrow("four main departments");
    expect(createLecturerAccountRequest(input("valid@gmail.com")).idNumber).toBe("EIE001");
  });
  it("upgrades the previous registry and preserves issued IDs and sequences", async () => {
    const request = createLecturerAccountRequest(input("first@gmail.com"));
    const db = globalThis.__roomBookingDatabase__!;
    db.exec(`DELETE FROM app_settings WHERE key = 'department_prefixes_v2';
      DROP TABLE department_lecturer_id_registry;
      CREATE TABLE department_lecturer_id_registry (
        prefix TEXT NOT NULL CHECK (prefix IN ('EIE','CE','ME','CS')),
        number INTEGER NOT NULL, owner TEXT NOT NULL UNIQUE, PRIMARY KEY(prefix, number)
      );`);
    db.prepare("INSERT INTO department_lecturer_id_registry VALUES ('EIE', 1, ?)").run(request.id);
    db.prepare("INSERT INTO department_lecturer_id_registry VALUES ('ME', 1, 'legacy-me')").run();
    vi.resetModules();
    const reloaded = await import("@/lib/server/database");
    expect(reloaded.createLecturerAccountRequest({ ...input("mechanical@gmail.com"), department: "Mechanical and Manufacturing Engineering" }).idNumber).toBe("MME001");
    expect(createLecturerAccountRequest({ ...input("marine@gmail.com"), department: "Marine and Naval Architecture" }).idNumber).toBe("MNAE001");
    expect(createLecturerAccountRequest(input("second@gmail.com")).idNumber).toBe("EIE002");
    expect(db.prepare("SELECT id_number FROM lecturer_account_requests WHERE id = ?").get(request.id)).toEqual({ id_number: "EIE001" });
    expect(db.prepare("SELECT number FROM department_lecturer_id_registry WHERE prefix = 'ME'").get()).toEqual({ number: 1 });
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
