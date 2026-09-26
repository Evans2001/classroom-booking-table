import { getLecturerRoomById } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const room = getLecturerRoomById(id, lecturerIdentityFromRequest(request));
    return room ? json(room) : errorResponse(new Error("Room not found"), 404);
  } catch (error) {
    return errorResponse(error);
  }
}
