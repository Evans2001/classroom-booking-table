import {
  deleteLecturerBooking,
  getLecturerBookingById,
  updateLecturerBooking,
} from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const booking = getLecturerBookingById(id);
  return booking ? json(booking) : errorResponse(new Error("Booking not found"), 404);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    return json(updateLecturerBooking(id, body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteLecturerBooking(id);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error, error instanceof Error && error.message === "Booking not found" ? 404 : 400);
  }
}
