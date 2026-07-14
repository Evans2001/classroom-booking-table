import { createLecturerIssue, listLecturerIssues } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return json(listLecturerIssues());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return json(await createLecturerIssue(body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
