import { decideAdminRequest } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    return json(decideAdminRequest(id, body.decision, body.note));
  } catch (error) {
    return errorResponse(error);
  }
}
