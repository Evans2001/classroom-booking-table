import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetRequestsService,
  createImportedRequests,
  decideRequest,
  listRequests,
} from "@/lib/services/requests.service";

describe("requests.service", () => {
  beforeEach(() => {
    __resetRequestsService();
  });

  it("approves a pending request", async () => {
    const requests = await listRequests({ status: "PENDING" });
    const pending = requests[0];
    const updated = await decideRequest(pending.id, "APPROVED", "Looks good");
    expect(updated.status).toBe("APPROVED");
    expect(updated.reviewer).toBeTruthy();
  });

  it("requires note for rejection", async () => {
    const requests = await listRequests({ status: "PENDING" });
    const pending = requests[0];
    await expect(decideRequest(pending.id, "REJECTED")).rejects.toThrow(
      "Rejection note is required",
    );
  });

  it("blocks approvals when a conflict exists", async () => {
    const [imported] = await createImportedRequests([
      {
        requesterName: "Conflict User",
        requesterEmail: "conflict@uni.edu",
        department: "Math",
        roomId: "room-1",
        purpose: "Conflict session",
        date: "2026-03-05",
        startTime: "10:30",
        endTime: "11:30",
        attendees: 10,
      },
    ]);

    await expect(decideRequest(imported.id, "APPROVED", "Approve")).rejects.toThrow(
      "Time conflict",
    );
  });
});
