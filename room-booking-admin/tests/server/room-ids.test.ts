// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { createAdminRoom, deleteAdminRoom, getAdminRoomById, getDatabase, listAdminRooms, updateAdminRoom, importTimetableEntries, listTimetableEntries, checkLecturerRoomAvailability, authenticateLecturerAccount, listLecturerTimetable } from "@/lib/server/database";

import { campusLocalDateTimeToIso, formatCampusDate, getCampusWeekdayAndMinute } from "@/lib/utils/campus-date-time";

const input = (code: string) => ({ name: code, capacity: 30, type: "LECTURE_HALL" as const, hasProjector: true, hasAc: true, status: "ACTIVE" as const });
afterEach(() => {
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});
describe("permanent room IDs", () => {
  it("creates a room without code, building, or floor using its automatic ID", () => {
    const room = createAdminRoom({ name: "Simple room", capacity: 20, type: "LECTURE_HALL", status: "ACTIVE", hasProjector: false, hasAc: false });
    expect(room).not.toHaveProperty("building");
    expect(room).not.toHaveProperty("floor");
    expect(room).not.toHaveProperty("code");
    expect(room.roomNumber).toMatch(/^R-\d{3,}$/);
    expect(updateAdminRoom(room.id, { name: "Renamed room" }).roomNumber).toBe(room.roomNumber);
  });
  it("uses room IDs for timetables, including historical room references and conflicts", () => {
    const room = listAdminRooms().find((item) => item.id === "room-1")!;
    const db = getDatabase();
    const date = formatCampusDate(new Date(Date.now() + 7 * 86400000));
    const startAt = campusLocalDateTimeToIso(date, "10:00");
    const endAt = campusLocalDateTimeToIso(date, "11:00");
    const day = getCampusWeekdayAndMinute(new Date(startAt)).weekday;
    db.prepare(`INSERT INTO timetable_entries (id, semester, department, batch, lecturer_name, lecturer_id, day_of_week, start_time, end_time, module_code, room_code, uploaded_at)
      VALUES ('legacy-entry', 'S1', 'Engineering', '2026', 'Teacher', '001', ?, '10:00', '11:00', 'CS101', 'LH-101', '2026-01-01')`).run(day);
    expect(listTimetableEntries()[0].roomNumber).toBe(room.roomNumber);
    expect(checkLecturerRoomAvailability({ roomId: room.id, startAt, endAt }).requiresApproval).toBe(true);
    const entry = { semester: "S2", department: "Engineering", batch: "2027", lecturerName: "Teacher", lecturerId: "001", dayOfWeek: day, startTime: "12:00", endTime: "13:00", moduleCode: "CS102", roomNumber: room.roomNumber };
    const imported = importTimetableEntries([{ ...entry, lecturerName: "Forged name" }])[0];
    expect(imported.roomNumber).toBe(room.roomNumber);
    expect(imported.roomName).toBe(room.name);
    expect(imported.lecturerName).toBe("Demo Lecturer");
    expect(() => importTimetableEntries([{ ...entry, lecturerId: "999" }])).toThrow("Unknown lecturer ID");
    db.prepare("UPDATE rooms SET name = 'Renamed hall' WHERE id = ?").run(room.id);
    db.prepare("UPDATE lecturer_accounts SET name = 'Renamed lecturer' WHERE id_number = '001'").run();
    const refreshed = listTimetableEntries().find((item) => item.id === imported.id)!;
    expect(refreshed.roomName).toBe("Renamed hall");
    expect(refreshed.lecturerName).toBe("Renamed lecturer");
    const account = authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123");
    db.prepare("UPDATE timetable_entries SET lecturer_id = '', lecturer_name = 'Renamed lecturer' WHERE id = 'legacy-entry'").run();
    const personal = listLecturerTimetable({ sessionToken: account.sessionToken });
    expect(personal.some((item) => item.id === imported.id)).toBe(true);
    expect(personal.some((item) => item.id === 'legacy-entry')).toBe(false);
    expect(() => importTimetableEntries([{ ...entry, roomNumber: "R-99999" }])).toThrow("Unknown room ID");
    expect(listTimetableEntries()).toHaveLength(2);
  });
  it("assigns all existing rooms unique IDs starting at R-001 and preserves them on repeated reads", () => {
    const rooms = listAdminRooms();
    const ids = rooms.map((room) => room.roomNumber).sort();
    expect(ids[0]).toBe("R-001");
    expect(new Set(ids).size).toBe(rooms.length);
    expect(ids).toEqual(Array.from({ length: rooms.length }, (_, i) => `R-${String(i + 1).padStart(3, "0")}`));
    expect(listAdminRooms()).toEqual(rooms);
  });
  it("assigns new IDs in order and keeps them on update, deletion and reactivation", () => {
    const existing = listAdminRooms();
    const first = createAdminRoom(input("TEST-A"));
    const second = createAdminRoom(input("TEST-B"));
    expect(Number(second.roomNumber.slice(2))).toBe(Number(first.roomNumber.slice(2)) + 1);
    deleteAdminRoom(first.id);
    expect(getAdminRoomById(first.id)?.roomNumber).toBe(first.roomNumber);
    expect(getAdminRoomById(second.id)?.roomNumber).toBe(second.roomNumber);
    const third = createAdminRoom(input("TEST-C"));
    expect(Number(third.roomNumber.slice(2))).toBe(Number(second.roomNumber.slice(2)) + 1);
    expect(updateAdminRoom(first.id, { status: "ACTIVE", name: "RENAMED" }).roomNumber).toBe(first.roomNumber);
    for (const room of existing) expect(getAdminRoomById(room.id)?.roomNumber).toBe(room.roomNumber);
    expect(listAdminRooms({ search: third.roomNumber }).map((room) => room.id)).toEqual([third.id]);
  });
  it("never reuses a number after permanent deletion and ignores client-supplied numbers", () => {
    const first = createAdminRoom(input("TEST-A"));
    getDatabase().prepare("DELETE FROM rooms WHERE id = ?").run(first.id);
    const second = createAdminRoom({ ...input("TEST-B"), roomNumber: "R-001" } as ReturnType<typeof input>);
    expect(Number(second.roomNumber.slice(2))).toBe(Number(first.roomNumber.slice(2)) + 1);
  });
  it("rejects invalid rooms without consuming a number and preserves booking links", () => {
    const db = getDatabase();
    const bookings = db.prepare("SELECT id, room_id FROM booking_requests").all();
    const first = createAdminRoom(input("TEST-A"));
    expect(() => createAdminRoom({ ...input("TEST-A"), capacity: 0 })).toThrow("Capacity");
    const second = createAdminRoom(input("TEST-B"));
    expect(Number(second.roomNumber.slice(2))).toBe(Number(first.roomNumber.slice(2)) + 1);
    expect(db.prepare("SELECT id, room_id FROM booking_requests").all()).toEqual(bookings);
  });
});
