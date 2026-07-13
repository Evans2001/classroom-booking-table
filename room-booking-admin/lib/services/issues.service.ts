import type { Issue, IssueFilters, IssueStatus } from "@/lib/types/issue";
import { apiGet, apiSend } from "@/lib/services/api-client";

export async function listIssues(filters?: IssueFilters): Promise<Issue[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.severity) params.set("severity", filters.severity);
  const query = params.toString();
  return apiGet<Issue[]>(`/api/admin/issues${query ? `?${query}` : ""}`);
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  const issues = await listIssues();
  return issues.find((issue) => issue.id === id);
}

export async function updateIssueStatus(
  id: string,
  status: IssueStatus,
  note?: string,
): Promise<Issue> {
  return apiSend<Issue>(`/api/admin/issues/${id}/status`, "PATCH", { status, note });
}

export async function countIssuesByStatus(status: IssueStatus): Promise<number> {
  const issues = await listIssues({ status });
  return issues.length;
}

export function __resetIssuesService(): void {
  // Database-backed service: no-op retained for backward compatibility.
}
