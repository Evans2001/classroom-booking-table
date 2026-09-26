import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  listIssues,
  updateIssueStatus,
} from "@/lib/services/issues.service";
import { issuesMock } from "@/lib/data/issues.mock";
import { jsonResponse } from "@/tests/helpers/http";

describe("issues.service", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lists issues", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(issuesMock));
    const issues = await listIssues();
    expect(issues).toEqual(issuesMock);
  });

  it("updates issue status", async () => {
    const target = issuesMock.find((issue) => issue.status === "OPEN")!;
    const updatedIssue = { ...target, status: "IN_PROGRESS" as const, resolutionNote: "Assigned" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse([target]))
      .mockResolvedValueOnce(jsonResponse(updatedIssue));
    const issues = await listIssues({ status: "OPEN" });
    const updated = await updateIssueStatus(issues[0].id, "IN_PROGRESS", "Assigned");
    expect(updated.status).toBe("IN_PROGRESS");
    expect(updated.resolutionNote).toBe("Assigned");
  });
});
