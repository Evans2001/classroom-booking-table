import {
  registerLecturerPushToken,
  unregisterLecturerPushToken,
} from "@/lib/server/database";
import { errorResponse, json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const body = (await request.json()) as {
      token?: string;
      platform?: string;
    };
    registerLecturerPushToken({
      token: body.token ?? "",
      platform: body.platform,
      sessionToken: authorization.toLowerCase().startsWith("bearer ")
        ? authorization.slice(7).trim()
        : "",
    });
    return json({ registered: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const body = (await request.json()) as { token?: string };
    unregisterLecturerPushToken({
      token: body.token ?? "",
      sessionToken: authorization.toLowerCase().startsWith("bearer ")
        ? authorization.slice(7).trim()
        : "",
    });
    return json({ unregistered: true });
  } catch (error) {
    return errorResponse(error);
  }
}
