import { proxyToBackend } from "@/lib/services/api-client";

export async function GET(request: Request) {
  return proxyToBackend("/api/lecturer/issues", {
    headers: request.headers,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/lecturer/issues", {
    method: "POST",
    headers: request.headers,
    body,
  });
}
