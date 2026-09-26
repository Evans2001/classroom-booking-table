import { decideAdminRequest } from "@/lib/server/database";
import { errorResponse, json, optionsResponse, requireAdminApiAuth } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { decision?: unknown; note?: unknown };
    if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
      throw new Error("Choose approve or reject.");
    }
    if (body.note !== undefined && typeof body.note !== "string") {
      throw new Error("Review note must be text.");
    }
    return json(await decideAdminRequest(id, body.decision, body.note));
  } catch (error) {
    return errorResponse(error);
  }
}
