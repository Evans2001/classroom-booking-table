import { createExpiredAdminSessionCookie } from "@/lib/server/admin-auth";

export function POST(): Response {
  return Response.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": createExpiredAdminSessionCookie(),
      },
    },
  );
}
