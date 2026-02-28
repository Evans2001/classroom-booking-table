import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetIssuesService,
  listIssues,
  updateIssueStatus,
} from "@/lib/services/issues.service";

describe("issues.service", () => {
  beforeEach(() => {
    __resetIssuesService();
  });

  it("lists issues", async () => {
    const issues = await listIssues();
    expect(issues.length).toBeGreaterThan(0);
  });

  it("updates issue status", async () => {
    const issues = await listIssues({ status: "OPEN" });
    const target = issues[0];
    const updated = await updateIssueStatus(target.id, "IN_PROGRESS", "Assigned");
    expect(updated.status).toBe("IN_PROGRESS");
    expect(updated.resolutionNote).toBe("Assigned");
  });
});
