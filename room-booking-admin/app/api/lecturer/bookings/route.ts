import { createLecturerBooking, listLecturerBookings } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return json(listLecturerBookings());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return json(createLecturerBooking(body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
