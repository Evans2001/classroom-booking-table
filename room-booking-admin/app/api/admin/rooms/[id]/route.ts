import { deleteAdminRoom, getAdminRoomById, updateAdminRoom } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const room = getAdminRoomById(id);
  return room ? json(room) : errorResponse(new Error("Room not found"), 404);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    return json(updateAdminRoom(id, body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteAdminRoom(id);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error, error instanceof Error && error.message === "Room not found" ? 404 : 400);
  }
}
