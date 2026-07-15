import {
  deleteLecturerBooking,
  getLecturerBookingById,
  updateLecturerBooking,
} from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

function lecturerIdentityFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return {
    sessionToken: authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : undefined,
    email: request.headers.get("x-lecturer-email") ?? undefined,
    name: request.headers.get("x-lecturer-name") ?? undefined,
    department: request.headers.get("x-lecturer-department") ?? undefined,
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const booking = getLecturerBookingById(id, lecturerIdentityFromRequest(request));
  return booking ? json(booking) : errorResponse(new Error("Booking not found"), 404);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
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
