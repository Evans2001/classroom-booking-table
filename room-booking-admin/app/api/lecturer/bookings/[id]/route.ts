import {
  deleteLecturerBooking,
  getLecturerBookingById,
  updateLecturerBooking,
} from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import {
  lecturerIdentityFromRequest,
  normalizeCampusBookingTimes,
} from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const booking = getLecturerBookingById(id, lecturerIdentityFromRequest(request));
    return booking ? json(booking) : errorResponse(new Error("Booking not found"), 404);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = normalizeCampusBookingTimes(await request.json());
    return json(updateLecturerBooking(id, body, lecturerIdentityFromRequest(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteLecturerBooking(id, lecturerIdentityFromRequest(request));
    return json({ success: true });
  } catch (error) {
    return errorResponse(error, error instanceof Error && error.message === "Booking not found" ? 404 : 400);
  }
}
