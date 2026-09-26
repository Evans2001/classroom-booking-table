import { createLecturerBooking, listLecturerBookings } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import {
  lecturerIdentityFromRequest,
  normalizeCampusBookingTimes,
} from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  try {
    return json(listLecturerBookings(lecturerIdentityFromRequest(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = normalizeCampusBookingTimes(await request.json());
    return json(await createLecturerBooking(body, lecturerIdentityFromRequest(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
