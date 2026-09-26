import { describe, expect, it } from "vitest";

import {
  campusLocalDateTimeToIso,
  formatCampusDate,
  formatCampusTime,
  getCampusWeekdayAndMinute,
} from "@/lib/utils/campus-date-time";

describe("campus date/time handling", () => {
  it("converts Colombo wall-clock input to an absolute UTC timestamp", () => {
    expect(campusLocalDateTimeToIso("2026-09-10", "14:30")).toBe("2026-09-10T09:00:00.000Z");
  });

  it("formats absolute timestamps in the campus timezone", () => {
    const instant = new Date("2026-09-10T19:00:00.000Z");
    expect(formatCampusDate(instant)).toBe("2026-09-11");
    expect(formatCampusTime(instant)).toBe("00:30");
    expect(getCampusWeekdayAndMinute(instant)).toEqual({ weekday: "Friday", minute: 30 });
  });

  it("rejects invalid calendar values", () => {
    expect(() => campusLocalDateTimeToIso("2026-02-30", "09:00")).toThrow("valid date");
    expect(() => campusLocalDateTimeToIso("2026-02-28", "25:00")).toThrow("valid date");
  });
});
