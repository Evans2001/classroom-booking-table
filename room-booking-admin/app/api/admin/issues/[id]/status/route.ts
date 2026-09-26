import { updateAdminIssueStatus } from "@/lib/server/database";
import { errorResponse, json, optionsResponse, requireAdminApiAuth } from "@/lib/server/api";
import type { IssueStatus } from "@/lib/types/issue";

const ISSUE_STATUSES = new Set<IssueStatus>(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export function OPTIONS() {
  return optionsResponse();
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown; note?: unknown };
    if (typeof body.status !== "string" || !ISSUE_STATUSES.has(body.status as IssueStatus)) {
      throw new Error("Choose a valid issue status.");
    }
    if (body.note !== undefined && typeof body.note !== "string") {
      throw new Error("Resolution note must be text.");
    }
    return json(await updateAdminIssueStatus(id, body.status as IssueStatus, body.note));
  } catch (error) {
    return errorResponse(error);
  }
}
