import { registerLecturerPushToken } from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lecturerEmail?: string;
      token?: string;
      platform?: string;
    };
    registerLecturerPushToken({
      lecturerEmail: body.lecturerEmail ?? "",
      token: body.token ?? "",
      platform: body.platform,
    });
    return json({ registered: true });
  } catch (error) {
    return errorResponse(error);
  }
}
