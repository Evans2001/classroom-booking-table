import { getLecturerIssueById } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const issue = getLecturerIssueById(id, lecturerIdentityFromRequest(request));
    return issue ? json(issue) : errorResponse(new Error("Issue not found"), 404);
  } catch (error) {
    return errorResponse(error);
  }
}
