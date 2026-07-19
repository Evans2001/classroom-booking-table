import { listLecturerTimetable } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() { return optionsResponse(); }
export function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    return json(listLecturerTimetable({ sessionToken: authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : undefined }));
  } catch (error) { return errorResponse(error); }
}
