import { updateAdminIssueStatus } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    return json(updateAdminIssueStatus(id, body.status, body.note));
  } catch (error) {
    return errorResponse(error);
  }
}
