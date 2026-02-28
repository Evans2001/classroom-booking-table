import { issuesMock } from "@/lib/data/issues.mock";
import type { Issue, IssueFilters, IssueStatus } from "@/lib/types/issue";

let issuesData: Issue[] = [...issuesMock];

const LATENCY_MS = 110;

const delay = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, LATENCY_MS);
  });

export async function listIssues(filters?: IssueFilters): Promise<Issue[]> {
  await delay();
  let filtered = [...issuesData];

  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((issue) => issue.status === filters.status);
  }
  if (filters?.severity && filters.severity !== "ALL") {
    filtered = filtered.filter((issue) => issue.severity === filters.severity);
  }
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      (issue) =>
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.roomId.toLowerCase().includes(query),
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
  );
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await delay();
  return issuesData.find((issue) => issue.id === id);
}

export async function updateIssueStatus(
  id: string,
  status: IssueStatus,
  note?: string,
): Promise<Issue> {
  await delay();
  const index = issuesData.findIndex((issue) => issue.id === id);
  if (index === -1) {
    throw new Error("Issue not found");
  }
  const current = issuesData[index];
  const updated: Issue = {
    ...current,
    status,
    resolutionNote: note?.trim() ? note.trim() : current.resolutionNote,
    resolvedAt:
      status === "RESOLVED" || status === "CLOSED"
        ? new Date().toISOString()
        : current.resolvedAt,
  };
  issuesData[index] = updated;
  return updated;
}

export async function countIssuesByStatus(status: IssueStatus): Promise<number> {
  await delay();
  return issuesData.filter((issue) => issue.status === status).length;
}

export function __resetIssuesService(): void {
  issuesData = [...issuesMock];
}
