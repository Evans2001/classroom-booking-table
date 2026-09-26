export const CAMPUS_TIME_ZONE =
  process.env.NEXT_PUBLIC_CAMPUS_TIME_ZONE?.trim() || "Asia/Colombo";

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
const MINUTE_IN_MILLISECONDS = 60_000;
const MAX_BOOKING_MINUTES = 12 * 60;
const MAX_ADVANCE_MINUTES = 366 * 24 * 60;

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function campusParts(value: string | Date): Record<string, string> | undefined {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return Object.fromEntries(
    dateTimePartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function toCampusDateTimeLocal(value: string | Date): string {
  if (typeof value === "string" && LOCAL_DATE_TIME_PATTERN.test(value)) {
    return value;
  }
  const parts = campusParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function campusDateKey(value: string | Date): string {
  return toCampusDateTimeLocal(value).slice(0, 10);
}

export function getMinCampusDateTimeInputValue(now = new Date()): string {
  const nextWholeMinute = new Date(
    Math.floor(now.getTime() / MINUTE_IN_MILLISECONDS) * MINUTE_IN_MILLISECONDS +
      MINUTE_IN_MILLISECONDS,
  );
  return toCampusDateTimeLocal(nextWholeMinute);
}

export function getMaxCampusDateTimeInputValue(now = new Date()): string {
  return toCampusDateTimeLocal(
    new Date(now.getTime() + MAX_ADVANCE_MINUTES * MINUTE_IN_MILLISECONDS),
  );
}

function campusWallClockMinute(value: string): number | undefined {
  if (!LOCAL_DATE_TIME_PATTERN.test(value)) return undefined;
  const milliseconds = Date.parse(`${value}:00.000Z`);
  return Number.isNaN(milliseconds) ? undefined : milliseconds / MINUTE_IN_MILLISECONDS;
}

export function validateCampusBookingWindow(
  startAt: string,
  endAt: string,
  now = new Date(),
): string | undefined {
  const startMinute = campusWallClockMinute(startAt);
  const endMinute = campusWallClockMinute(endAt);
  const currentMinute = campusWallClockMinute(toCampusDateTimeLocal(now));
  if (startMinute === undefined || endMinute === undefined || currentMinute === undefined) {
    return "Choose valid start and end times.";
  }
  if (startMinute <= currentMinute) return "Start time must be in the future.";
  if (endMinute <= startMinute) return "End time must be later than start time.";
  if (startAt.slice(0, 10) !== endAt.slice(0, 10)) {
    return "Bookings must start and end on the same campus day.";
  }
  if (endMinute - startMinute > MAX_BOOKING_MINUTES) {
    return "A booking cannot be longer than 12 hours.";
  }
  if (startMinute - currentMinute > MAX_ADVANCE_MINUTES) {
    return "Bookings can be made up to one year in advance.";
  }
  return undefined;
}
