import type { LecturerAccountRequestStatus } from "@/lib/server/database";
import { listLecturerAccountRequests } from "@/lib/server/database";
import { json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as LecturerAccountRequestStatus | "ALL" | null;
  return json(listLecturerAccountRequests(status ?? "ALL"));
}
