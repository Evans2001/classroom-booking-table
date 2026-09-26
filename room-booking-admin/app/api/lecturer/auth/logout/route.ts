import { revokeLecturerSession } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const sessionToken = authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : "";
    revokeLecturerSession(sessionToken);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
