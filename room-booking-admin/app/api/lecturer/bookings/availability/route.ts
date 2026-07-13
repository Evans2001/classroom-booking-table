import { checkLecturerRoomAvailability } from "@/lib/server/database";
import { json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  const body = await request.json();
  return json(checkLecturerRoomAvailability(body));
}
