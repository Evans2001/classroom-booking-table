import { listLecturerRooms } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  try {
    return json(listLecturerRooms(lecturerIdentityFromRequest(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
