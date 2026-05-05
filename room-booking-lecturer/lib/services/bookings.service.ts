import { bookingsMock } from "@/lib/data/bookings.mock";
import { roomsMock } from "@/lib/data/rooms.mock";
import type { AvailabilityResult, Booking, BookingInput } from "@/lib/types/booking";

let bookingsData: Booking[] = [...bookingsMock];

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 90));
const BOOKING_MIN_DAYS_AHEAD = 7;

function getMinAllowedStartDate(): Date {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + BOOKING_MIN_DAYS_AHEAD);
  return min;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function toDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function formatLocalDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getMinBookingDateTimeInputValue(): string {
  return formatLocalDateTimeInput(getMinAllowedStartDate());
}

export async function listMyBookings(): Promise<Booking[]> {
  await wait();
  return [...bookingsData].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export async function checkRoomAvailability(input: Pick<BookingInput, "roomId" | "startAt" | "endAt">): Promise<AvailabilityResult> {
  await wait();

  const room = roomsMock.find((entry) => entry.id === input.roomId);
  if (!room) {
    return { available: false, message: "Selected room not found." };
  }
  if (room.status === "UNAVAILABLE") {
    return { available: false, message: "Room is currently unavailable." };
  }

  const startAt = toDate(input.startAt);
  const endAt = toDate(input.endAt);
  if (!startAt || !endAt) {
    return { available: false, message: "Choose valid start and end date/time." };
  }
  if (endAt <= startAt) {
    return { available: false, message: "End date/time must be after start date/time." };
  }

  const minAllowed = getMinAllowedStartDate();
  if (startAt < minAllowed) {
    return {
      available: false,
      message: `Bookings must be made at least ${BOOKING_MIN_DAYS_AHEAD} days in advance.`,
    };
  }

  const conflicting = bookingsData.some((booking) => {
    if (booking.roomId !== input.roomId) return false;
    if (booking.status === "REJECTED" || booking.status === "CANCELLED") return false;

    const bookingStart = new Date(booking.startAt);
    const bookingEnd = new Date(booking.endAt);
    return overlaps(startAt, endAt, bookingStart, bookingEnd);
  });

  if (conflicting) {
    return { available: false, message: "Room is not available for the selected period." };
  }

  return { available: true, message: "Room is available for this period." };
}

export async function createBookingRequest(input: BookingInput): Promise<Booking> {
  const availability = await checkRoomAvailability(input);
  if (!availability.available) {
    throw new Error(availability.message);
  }

  const room = roomsMock.find((entry) => entry.id === input.roomId);
  if (!room) {
    throw new Error("Selected room not found");
  }

  const booking: Booking = {
    id: `bk-${Date.now()}`,
    requesterName: "Demo Student",
    roomId: input.roomId,
    roomName: room.name,
    building: room.building,
    roomCode: room.code,
    startAt: new Date(input.startAt).toISOString(),
    endAt: new Date(input.endAt).toISOString(),
    purpose: input.purpose,
    attendees: input.attendees,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
  };

  bookingsData = [booking, ...bookingsData];
  return booking;
}
