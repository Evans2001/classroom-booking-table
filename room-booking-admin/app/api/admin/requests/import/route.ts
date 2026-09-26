import { createImportedAdminRequests } from "@/lib/server/database";
import { errorResponse, json, optionsResponse, requireAdminApiAuth } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    return json(createImportedAdminRequests(body.rows ?? []), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
