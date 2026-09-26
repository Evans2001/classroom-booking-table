import { NextResponse } from "next/server";

import { proxyToBackend } from "@/lib/services/api-client";
import type { LecturerAccount } from "@/lib/types/account";
import { AUTH_COOKIE_NAME, AUTH_MAX_AGE_SECONDS, isValidLecturerSessionToken } from "@/lib/utils/constants";

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await proxyToBackend("/api/lecturer/auth/login", {
    method: "POST",
    body,
  });

  if (!upstream.ok) {
    return upstream;
  }

  const account = (await upstream.json()) as LecturerAccount;
  if (!isValidLecturerSessionToken(account.sessionToken)) {
    return NextResponse.json({ error: "The server returned an invalid lecturer session." }, { status: 502 });
  }

  const { sessionToken, ...publicAccount } = account;
  const response = NextResponse.json(publicAccount);
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
