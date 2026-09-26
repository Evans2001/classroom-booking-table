import { describe, expect, it } from "vitest";

import {
  assertFutureBookingWindow,
  getMinBookingDateTimeInputValue,
} from "@/lib/utils/booking-date-time";

describe("booking date/time validation", () => {
  it("returns the next whole local minute instead of an already-started minute", () => {
    const now = new Date(2026, 8, 10, 14, 27, 42, 900);

    expect(getMinBookingDateTimeInputValue(now)).toBe("2026-09-10T14:28");
  });

  it("rolls the minimum into the next day at midnight", () => {
    const now = new Date(2026, 11, 31, 23, 59, 59);

    expect(getMinBookingDateTimeInputValue(now)).toBe("2027-01-01T00:00");
  });

  it("accepts a future booking without imposing a seven-day delay", () => {
    const now = new Date("2026-09-10T08:00:00.000Z");

    expect(() =>
      assertFutureBookingWindow(
        "2026-09-10T08:01:00.000Z",
        "2026-09-10T09:01:00.000Z",
        now,
      ),
    ).not.toThrow();
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
        "2026-09-10T00:30:00.000Z",
        "2026-09-10T13:31:00.000Z",
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
