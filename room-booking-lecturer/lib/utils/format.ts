import { CAMPUS_TIME_ZONE } from "@/lib/utils/date-time";

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(date);
}

export function formatDateTimeRange(startAt: string, endAt: string): string {
  return `${formatDateTime(startAt)} to ${formatDateTime(endAt)}`;
}

export function formatMonthShort(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDayNumber(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(new Date(value));
}

export function formatWeekdayShort(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CAMPUS_TIME_ZONE,
  }).format(new Date(value));
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
