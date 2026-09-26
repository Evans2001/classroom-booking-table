export const CAMPUS_TIME_ZONE = process.env.CAMPUS_TIME_ZONE?.trim() || "Asia/Colombo";

type CampusParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function campusParts(date: Date): CampusParts {
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date and time.");
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday: values.weekday,
  };
}

export function formatCampusDate(date: Date): string {
  const parts = campusParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatCampusTime(date: Date): string {
  const parts = campusParts(date);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getCampusWeekdayAndMinute(date: Date): { weekday: string; minute: number } {
  const parts = campusParts(date);
  return { weekday: parts.weekday, minute: parts.hour * 60 + parts.minute };
}

export function campusLocalDateTimeToIso(dateValue: string, timeValue: string): string {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeValue.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!dateMatch || !timeMatch) throw new Error("Choose a valid date and time.");

  const desired = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const desiredUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  const normalized = new Date(desiredUtc);
  if (
    normalized.getUTCFullYear() !== desired.year
    || normalized.getUTCMonth() + 1 !== desired.month
    || normalized.getUTCDate() !== desired.day
  ) {
    throw new Error("Choose a valid date and time.");
  }

  let instant = desiredUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = campusParts(new Date(instant));
    const representedUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    const adjustment = desiredUtc - representedUtc;
    if (adjustment === 0) return new Date(instant).toISOString();
    instant += adjustment;
  }
  throw new Error(`The selected local time is not valid in ${CAMPUS_TIME_ZONE}.`);
}
