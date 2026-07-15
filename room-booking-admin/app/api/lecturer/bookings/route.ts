import { createLecturerBooking, listLecturerBookings } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

function lecturerIdentityFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return {
    sessionToken: authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : undefined,
    email: request.headers.get("x-lecturer-email") ?? undefined,
    name: request.headers.get("x-lecturer-name") ?? undefined,
    department: request.headers.get("x-lecturer-department") ?? undefined,
  };
}

export async function GET(request: Request) {
  return json(listLecturerBookings(lecturerIdentityFromRequest(request)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return json(await createLecturerBooking(body, lecturerIdentityFromRequest(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
