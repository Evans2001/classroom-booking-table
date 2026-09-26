import { formatCampusDate } from "@/lib/utils/campus-date-time";

const MINUTE_IN_MILLISECONDS = 60_000;
const MAX_BOOKING_DURATION_IN_MILLISECONDS = 12 * 60 * MINUTE_IN_MILLISECONDS;
const MAX_BOOKING_ADVANCE_IN_MILLISECONDS = 366 * 24 * 60 * MINUTE_IN_MILLISECONDS;

function parseDateTime(value: string): Date {
  return new Date(value);
}

/**
 * Validates a booking window against a single clock reading so boundary checks
 * cannot disagree when the minute changes during validation.
 */
export function assertFutureBookingWindow(
  startAtValue: string,
  endAtValue: string,
  now = new Date(),
): void {
  const startAt = parseDateTime(startAtValue);
  const endAt = parseDateTime(endAtValue);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Choose valid start and end date/time.");
  }
  if (endAt <= startAt) {
    throw new Error("End date/time must be after start date/time.");
  }
  if (startAt <= now) {
    throw new Error("Booking start date/time must be in the future.");
  }
  if (formatCampusDate(startAt) !== formatCampusDate(endAt)) {
    throw new Error("Bookings must start and end on the same campus day.");
  }
  if (endAt.getTime() - startAt.getTime() > MAX_BOOKING_DURATION_IN_MILLISECONDS) {
    throw new Error("A booking cannot be longer than 12 hours.");
  }
  if (startAt.getTime() - now.getTime() > MAX_BOOKING_ADVANCE_IN_MILLISECONDS) {
    throw new Error("Bookings can be made up to one year in advance.");
  }
}

/**
 * Returns the first whole minute that is still in the future. `datetime-local`
 * fields cannot represent seconds, so returning the current minute would be
 * rejected by the server for most of that minute.
 */
export function getMinBookingDateTimeInputValue(now = new Date()): string {
  const min = new Date(now.getTime());
  min.setSeconds(0, 0);
  min.setTime(min.getTime() + MINUTE_IN_MILLISECONDS);

  const year = min.getFullYear();
  const month = `${min.getMonth() + 1}`.padStart(2, "0");
  const day = `${min.getDate()}`.padStart(2, "0");
  const hours = `${min.getHours()}`.padStart(2, "0");
  const minutes = `${min.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
