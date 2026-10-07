import { isAuthenticatedAdminRequest } from "@/lib/server/admin-auth";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(error: unknown, status?: number): Response {
  const message = error instanceof Error ? error.message : "Request failed";
  const isLecturerAuthError = message === "Lecturer login required." || message === "Invalid lecturer session.";
  return json({ error: message }, { status: status ?? (isLecturerAuthError ? 401 : 400) });
}

export function optionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function requireAdminApiAuth(request: Request): Response | undefined {
  if (!isAuthenticatedAdminRequest(request)) {
    return Response.json(
      { error: "Admin authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    const origin = request.headers.get("origin");
    const requestUrl = new URL(request.url);
    // Next.js may use the listen address (0.0.0.0) in request.url.
    // Host identifies the destination the browser actually requested.
    requestUrl.host = request.headers.get("host") ?? requestUrl.host;
    // TLS terminates at the reverse proxy, so the backend URL can be HTTP.
    // Use an explicitly configured public origin rather than trusting forwarded headers.
    const publicOrigin = process.env.ADMIN_PUBLIC_ORIGIN?.trim();
    const expectedOrigin = publicOrigin ? new URL(publicOrigin).origin : requestUrl.origin;
    if (origin && origin !== expectedOrigin) {
      return Response.json(
        { error: "Cross-origin admin requests are not allowed." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return undefined;
}
