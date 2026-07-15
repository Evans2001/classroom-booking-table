import { proxyToBackend } from "@/lib/services/api-client";

export async function GET(request: Request) {
  return proxyToBackend("/api/lecturer/bookings", {
    headers: request.headers,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/lecturer/bookings", {
    method: "POST",
    headers: request.headers,
    body,
  });
}
