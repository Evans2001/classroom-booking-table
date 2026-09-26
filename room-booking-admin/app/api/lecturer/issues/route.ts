import { createLecturerIssue, listLecturerIssues } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  try {
    return json(listLecturerIssues(lecturerIdentityFromRequest(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return json(await createLecturerIssue(body, lecturerIdentityFromRequest(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
