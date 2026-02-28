export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Issue {
  id: string;
  roomId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface IssueFilters {
  search?: string;
  status?: IssueStatus | "ALL";
  severity?: IssueSeverity | "ALL";
}
