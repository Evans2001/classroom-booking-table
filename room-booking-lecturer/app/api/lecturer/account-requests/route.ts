import { proxyToBackend } from "@/lib/services/api-client";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/lecturer/account-requests", {
    method: "POST",
    body,
  });
}
