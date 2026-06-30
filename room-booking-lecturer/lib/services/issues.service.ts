import { issuesMock } from "@/lib/data/issues.mock";
import { roomsMock } from "@/lib/data/rooms.mock";
import type { Issue, IssueInput } from "@/lib/types/issue";

let issuesData: Issue[] = [...issuesMock];

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 90));

export async function listMyIssues(): Promise<Issue[]> {
  await wait();
  return [...issuesData].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await wait();
  return issuesData.find((issue) => issue.id === id);
}

export async function createIssue(input: IssueInput): Promise<Issue> {
  await wait();
  const room = roomsMock.find((entry) => entry.id === input.roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const now = new Date().toISOString();
  const issue: Issue = {
    id: `is-${Date.now()}`,
    roomId: input.roomId,
    roomName: room.name,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: "OPEN",
    imageUrl: input.imageUrl,
    createdAt: now,
    updates: [
      {
        status: "OPEN",
        note: "Issue submitted from lecturer mobile app.",
        at: now,
      },
    ],
  };
  issuesData = [issue, ...issuesData];
  return issue;
}
