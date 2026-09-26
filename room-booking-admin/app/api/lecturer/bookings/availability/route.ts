import { assertLecturerSession, checkLecturerRoomAvailability } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import {
  lecturerIdentityFromRequest,
  normalizeCampusBookingTimes,
} from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    assertLecturerSession(lecturerIdentityFromRequest(request));
    const body = normalizeCampusBookingTimes(await request.json());
    return json(checkLecturerRoomAvailability(body));
  } catch (error) {
    return errorResponse(error);
  }
}
