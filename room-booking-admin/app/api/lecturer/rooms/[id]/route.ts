import { getLecturerRoomById } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const room = getLecturerRoomById(id);
  return room ? json(room) : errorResponse(new Error("Room not found"), 404);
}
