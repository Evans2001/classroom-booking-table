import { authenticateLecturerAccount } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { identifier?: string; password?: string };
    const account = authenticateLecturerAccount(body.identifier ?? "", body.password ?? "");
    return json(account);
  } catch (error) {
    return errorResponse(error, 401);
  }
}
