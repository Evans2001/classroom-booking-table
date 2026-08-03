import { proxyToBackend } from "@/lib/services/api-client";
export async function GET(request: Request) { return proxyToBackend("/api/lecturer/timetable", { headers: request.headers }); }
