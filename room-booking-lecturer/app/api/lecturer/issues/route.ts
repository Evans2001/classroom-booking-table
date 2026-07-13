import { proxyToBackend } from "@/lib/services/api-client";

export async function GET() {
  return proxyToBackend("/api/lecturer/issues");
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/lecturer/issues", {
    method: "POST",
    body,
  });
}
