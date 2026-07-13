import type { RequestFilters } from "@/lib/types/request";
import { listAdminRequests } from "@/lib/server/database";
import { json, optionsResponse } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  return json(
    listAdminRequests({
      search,
      status: status as RequestFilters["status"],
    }),
  );
}
