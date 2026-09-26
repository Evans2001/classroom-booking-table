// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  authenticateLecturerAccount,
  createAdminRoom,
  createLecturerBooking,
  deleteLecturerBooking,
  getLecturerBookingById,
  updateLecturerBooking,
} from "@/lib/server/database";
import {
  campusLocalDateTimeToIso,
  formatCampusDate,
} from "@/lib/utils/campus-date-time";

afterEach(() => vi.unstubAllEnvs());

describe("lecturer booking conflict handling", () => {
  it("keeps an existing approval stable and auto-approves a conflict-free edit", async () => {
    const room = createAdminRoom({
      code: `TEST-${Date.now()}`,
      name: "Conflict test room",
      building: "Test building",
      floor: 1,
      capacity: 20,
      type: "MEETING_ROOM",
      hasProjector: false,
      hasAc: false,
      status: "ACTIVE",
    });
    const account = authenticateLecturerAccount(
      "lecturer@eng.ruh.ac.lk",
      "Lecturer@123",
    );
    const identity = { sessionToken: account.sessionToken };
    const date = formatCampusDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1_000));
    const base = {
      roomId: room.id,
      moduleName: "Conflict testing",
      purpose: "Verify stable booking decisions",
      attendees: 10,
    };

    const approved = await createLecturerBooking({
      ...base,
      startAt: campusLocalDateTimeToIso(date, "10:00"),
      endAt: campusLocalDateTimeToIso(date, "11:00"),
    }, identity);
    const conflicting = await createLecturerBooking({
      ...base,
      startAt: campusLocalDateTimeToIso(date, "10:30"),
      endAt: campusLocalDateTimeToIso(date, "11:30"),
    }, identity);

    expect(approved.status).toBe("APPROVED");
    expect(conflicting.status).toBe("PENDING");
    expect(getLecturerBookingById(approved.id, identity)?.status).toBe("APPROVED");

    const edited = updateLecturerBooking(conflicting.id, {
      ...base,
      startAt: campusLocalDateTimeToIso(date, "12:00"),
      endAt: campusLocalDateTimeToIso(date, "13:00"),
    }, identity);
    expect(edited.status).toBe("APPROVED");

    deleteLecturerBooking(edited.id, identity);
    expect(getLecturerBookingById(edited.id, identity)?.status).toBe("CANCELLED");
    expect(() => updateLecturerBooking(edited.id, {
      ...base,
      startAt: campusLocalDateTimeToIso(date, "14:00"),
      endAt: campusLocalDateTimeToIso(date, "15:00"),
    }, identity)).toThrow("cancelled bookings cannot be edited");
  });

  it("rejects the exact seeded demo identity when running in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      authenticateLecturerAccount("lecturer@eng.ruh.ac.lk", "Lecturer@123"),
    ).toThrow("Invalid lecturer credentials");
  });
});
