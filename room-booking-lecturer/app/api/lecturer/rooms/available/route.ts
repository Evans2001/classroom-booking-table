import { proxyToBackend } from "@/lib/services/api-client";

export async function POST(request: Request) {
  return proxyToBackend("/api/lecturer/rooms/available", {
    method: "POST",
    headers: request.headers,
    body: await request.text(),
  });
}
