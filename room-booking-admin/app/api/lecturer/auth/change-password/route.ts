import { changeLecturerPassword } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";
import { lecturerIdentityFromRequest } from "@/lib/server/lecturer-api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      nextPassword?: string;
    };
    const account = changeLecturerPassword(
      body.currentPassword ?? "",
      body.nextPassword ?? "",
      lecturerIdentityFromRequest(request),
    );
    return json(account);
  } catch (error) {
    return errorResponse(error);
  }
}
