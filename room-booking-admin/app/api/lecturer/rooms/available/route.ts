import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { listAvailableLecturerRooms } from "@/lib/server/database";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { startAt?: string; endAt?: string };
    if (!body.startAt || !body.endAt) {
      throw new Error("Start and end date/time are required.");
    }
    return json(listAvailableLecturerRooms(body.startAt, body.endAt));
  } catch (error) {
    return errorResponse(error);
  }
}
