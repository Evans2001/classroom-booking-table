import { changeLecturerPassword } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      currentPassword?: string;
      nextPassword?: string;
    };
    const account = changeLecturerPassword(
      body.identifier ?? "",
      body.currentPassword ?? "",
      body.nextPassword ?? "",
    );
    return json(account);
  } catch (error) {
    return errorResponse(error);
  }
}
