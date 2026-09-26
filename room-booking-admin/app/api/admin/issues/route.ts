import type { IssueFilters } from "@/lib/types/issue";
import { listAdminIssues } from "@/lib/server/database";
import { json, optionsResponse, requireAdminApiAuth } from "@/lib/server/api";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  return json(
    listAdminIssues({
      search,
      status: status as IssueFilters["status"],
      severity: severity as IssueFilters["severity"],
    }),
  );
}
