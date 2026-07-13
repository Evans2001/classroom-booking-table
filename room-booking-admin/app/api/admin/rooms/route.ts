import type { RoomFilters } from "@/lib/types/room";
import { createAdminRoom, listAdminRooms } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  return json(
    listAdminRooms({
      search,
      status: status as RoomFilters["status"],
      type: type as RoomFilters["type"],
    }),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return json(createAdminRoom(body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
