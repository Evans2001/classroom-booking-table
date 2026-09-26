import { NextResponse } from "next/server";

import { proxyToBackend } from "@/lib/services/api-client";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

export async function POST(request: Request) {
  try {
    await proxyToBackend("/api/lecturer/auth/logout", {
      method: "POST",
      headers: request.headers,
    });
  } catch {
    // Local sign-out must still succeed if the backend is temporarily offline.
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
