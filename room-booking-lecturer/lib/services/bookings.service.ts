import type { AvailabilityResult, Booking, BookingInput } from "@/lib/types/booking";
import { apiGet, apiSend } from "@/lib/services/api-client";

export function getMinBookingDateTimeInputValue(): string {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + 7);
  const year = min.getFullYear();
  const month = `${min.getMonth() + 1}`.padStart(2, "0");
  const day = `${min.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}T00:00`;
}

type AvailabilityInput = Pick<BookingInput, "roomId" | "startAt" | "endAt"> & {
  excludeBookingId?: string;
};

export async function listMyBookings(): Promise<Booking[]> {
  return apiGet<Booking[]>("/api/lecturer/bookings");
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  try {
    return await apiGet<Booking>(`/api/lecturer/bookings/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Booking not found") {
      return undefined;
    }
    throw error;
  }
}

export async function checkRoomAvailability(input: AvailabilityInput): Promise<AvailabilityResult> {
  return apiSend<AvailabilityResult>("/api/lecturer/bookings/availability", "POST", input);
}

export async function createBookingRequest(input: BookingInput): Promise<Booking> {
  return apiSend<Booking>("/api/lecturer/bookings", "POST", input);
}

export async function updateBookingRequest(id: string, input: BookingInput): Promise<Booking> {
  return apiSend<Booking>(`/api/lecturer/bookings/${id}`, "PUT", input);
}

export async function deleteBookingRequest(id: string): Promise<void> {
  await apiSend<{ success: boolean }>(`/api/lecturer/bookings/${id}`, "DELETE");
}
