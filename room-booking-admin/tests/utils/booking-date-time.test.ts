import { describe, expect, it } from "vitest";

import {
  assertFutureBookingWindow,
  getMinBookingDateTimeInputValue,
} from "@/lib/utils/booking-date-time";

describe("booking date/time validation", () => {
  it("rounds the one-hour minimum up to a whole local minute", () => {
    const now = new Date(2026, 8, 10, 14, 27, 42, 900);

    expect(getMinBookingDateTimeInputValue(now)).toBe("2026-09-10T15:28");
  });

  it("rolls the minimum into the next day at midnight", () => {
    const now = new Date(2026, 11, 31, 23, 59, 59);

    expect(getMinBookingDateTimeInputValue(now)).toBe("2027-01-01T01:00");
  });

  it("accepts a booking exactly one hour ahead", () => {
    const now = new Date("2026-09-10T08:00:00.000Z");

    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T09:00:00.000Z",
        "2026-09-10T10:00:00.000Z",
        now,
      ),
    ).not.toThrow();
  });

  it("rejects a booking just under one hour ahead", () => {
    expect(() => assertFutureBookingWindow(
      "2026-09-10T09:00:00.000Z",
      "2026-09-10T10:00:00.000Z",
      new Date("2026-09-10T08:00:00.001Z"),
    )).toThrow("at least 1 hour");
  });

  it("rejects starts at the current instant and invalid ranges", () => {
    const now = new Date("2026-09-10T08:00:00.000Z");

    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T08:00:00.000Z",
        "2026-09-10T09:00:00.000Z",
        now,
      ),
    ).toThrow("must be in the future");
    expect(() => assertFutureBookingWindow("invalid", "invalid", now)).toThrow(
      "Choose valid start and end date/time",
    );
    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T09:00:00.000Z",
        "2026-09-10T08:30:00.000Z",
        now,
      ),
    ).toThrow("must be after");
  });

  it("rejects cross-day, excessive-duration, and excessive-advance bookings", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");

    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T18:00:00.000Z",
        "2026-09-10T19:00:00.000Z",
        now,
      ),
    ).toThrow("same campus day");
    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T01:00:00.000Z",
        "2026-09-10T14:01:00.000Z",
        now,
      ),
    ).toThrow("longer than 12 hours");
    expect(() =>
      assertFutureBookingWindow(
        "2028-01-01T03:30:00.000Z",
        "2028-01-01T04:30:00.000Z",
        now,
      ),
    ).toThrow("one year in advance");
  });
});


describe("lecturer booking notice", () => {
  it("uses campus time and rounds up fractional minutes", async () => {
    const { getMinCampusDateTimeInputValue, validateCampusBookingWindow } =
      await import("../../../room-booking-lecturer/lib/utils/date-time");
    const now = new Date("2026-09-10T08:00:00.000Z");
    expect(getMinCampusDateTimeInputValue(now)).toBe("2026-09-10T14:30");
    expect(validateCampusBookingWindow("2026-09-10T14:30", "2026-09-10T15:30", now)).toBeUndefined();
    expect(validateCampusBookingWindow("2026-09-10T14:29", "2026-09-10T15:30", now)).toContain("at least 1 hour");
    const justAfter = new Date(now.getTime() + 1);
    expect(getMinCampusDateTimeInputValue(justAfter)).toBe("2026-09-10T14:31");
    expect(validateCampusBookingWindow("2026-09-10T14:30", "2026-09-10T15:30", justAfter)).toContain("at least 1 hour");
  });
});
