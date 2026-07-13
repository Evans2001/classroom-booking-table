import type { Issue, IssueInput } from "@/lib/types/issue";
import { apiGet, apiSend } from "@/lib/services/api-client";

export async function listMyIssues(): Promise<Issue[]> {
  return apiGet<Issue[]>("/api/lecturer/issues");
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  try {
    return await apiGet<Issue>(`/api/lecturer/issues/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Issue not found") {
      return undefined;
    }
    throw error;
  }
}

export async function createIssue(input: IssueInput): Promise<Issue> {
  return apiSend<Issue>("/api/lecturer/issues", "POST", input);
}
