import { describe, expect, it } from "vitest";

import {
  lecturerIdentityFromRequest,
  normalizeCampusBookingTimes,
} from "@/lib/server/lecturer-api";

describe("lecturer API request normalization", () => {
  it("extracts only the bearer session identity", () => {
    const identity = lecturerIdentityFromRequest(
      new Request("http://localhost/api/lecturer/rooms", {
        headers: {
          authorization: "Bearer abc123",
          "x-lecturer-email": "forged@example.edu",
        },
      }),
    );

    expect(identity).toEqual({ sessionToken: "abc123" });
  });

  it("converts campus wall-clock fields to UTC and prefers them over client ISO fields", () => {
    const normalized = normalizeCampusBookingTimes({
      startAt: "2099-01-01T00:00:00.000Z",
      endAt: "2099-01-01T01:00:00.000Z",
      startLocal: "2026-09-10T14:30",
      endLocal: "2026-09-10T15:30",
    });

    expect(normalized.startAt).toBe("2026-09-10T09:00:00.000Z");
    expect(normalized.endAt).toBe("2026-09-10T10:00:00.000Z");
  });

  it("rejects partial or malformed campus wall-clock fields", () => {
    expect(() =>
      normalizeCampusBookingTimes({ startLocal: "2026-09-10T14:30" }),
    ).toThrow("required");
    expect(() =>
      normalizeCampusBookingTimes({
        startLocal: "2026-09-10T29:00",
        endLocal: "2026-09-10T30:00",
      }),
    ).toThrow("valid date");
  });
});
