import { getLecturerIssueById } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const issue = getLecturerIssueById(id);
  return issue ? json(issue) : errorResponse(new Error("Issue not found"), 404);
}
