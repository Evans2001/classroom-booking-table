import { decideLecturerAccountRequest } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { decision?: "APPROVED" | "REJECTED"; note?: string };
    if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
      throw new Error("Choose approve or reject.");
    }
    return json(await decideLecturerAccountRequest(id, body.decision, body.note));
  } catch (error) {
    return errorResponse(error);
  }
}
