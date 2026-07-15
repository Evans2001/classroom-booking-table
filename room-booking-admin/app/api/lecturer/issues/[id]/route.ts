import { getLecturerIssueById } from "@/lib/server/database";
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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const issue = getLecturerIssueById(id, lecturerIdentityFromRequest(request));
  return issue ? json(issue) : errorResponse(new Error("Issue not found"), 404);
}
