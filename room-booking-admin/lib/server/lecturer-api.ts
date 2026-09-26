import { campusLocalDateTimeToIso } from "@/lib/utils/campus-date-time";

export function lecturerIdentityFromRequest(request: Request): { sessionToken?: string } {
  const authorization = request.headers.get("authorization") ?? "";
  return {
    sessionToken: authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : undefined,
  };
}

function campusLocalValueToIso(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Start and end date/time are required.");
  }
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)$/);
  if (!match) {
    throw new Error("Choose a valid date and time.");
  }
  return campusLocalDateTimeToIso(match[1], match[2]);
}

export function normalizeCampusBookingTimes<T extends Record<string, unknown>>(
  input: T,
): T & { startAt: string; endAt: string } {
  const hasLocalValues = input.startLocal !== undefined || input.endLocal !== undefined;
  if (hasLocalValues) {
    return {
      ...input,
      startAt: campusLocalValueToIso(input.startLocal),
      endAt: campusLocalValueToIso(input.endLocal),
    };
  }
  if (typeof input.startAt !== "string" || typeof input.endAt !== "string") {
    throw new Error("Start and end date/time are required.");
  }
  return { ...input, startAt: input.startAt, endAt: input.endAt };
}
