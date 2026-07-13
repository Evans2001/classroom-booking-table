export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IssueUpdate {
  status: IssueStatus;
  note: string;
  at: string;
}

export interface Issue {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  imageUrl?: string;
  createdAt: string;
  updates: IssueUpdate[];
}

export interface IssueInput {
  roomId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  imageUrl?: string;
}
