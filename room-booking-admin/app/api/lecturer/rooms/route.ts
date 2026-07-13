import { listLecturerRooms } from "@/lib/server/database";
import { json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return json(listLecturerRooms());
}
