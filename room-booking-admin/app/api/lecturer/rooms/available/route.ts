import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { listAvailableLecturerRooms } from "@/lib/server/database";
import {
  lecturerIdentityFromRequest,
  normalizeCampusBookingTimes,
} from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = normalizeCampusBookingTimes(await request.json());
    return json(
      listAvailableLecturerRooms(
        body.startAt,
        body.endAt,
        lecturerIdentityFromRequest(request),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
