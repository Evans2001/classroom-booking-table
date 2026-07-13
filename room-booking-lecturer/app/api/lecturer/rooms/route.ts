import { proxyToBackend } from "@/lib/services/api-client";

export async function GET() {
  return proxyToBackend("/api/lecturer/rooms");
}
