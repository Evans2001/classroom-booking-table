import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createImportedRequests,
  decideRequest,
  listRequests,
} from "@/lib/services/requests.service";
import { requestsMock } from "@/lib/data/requests.mock";
import { jsonResponse } from "@/tests/helpers/http";

describe("requests.service", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("approves a pending request", async () => {
    const pending = requestsMock.find((request) => request.status === "PENDING")!;
    const approved = { ...pending, status: "APPROVED" as const, reviewer: "System Admin" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse([pending]))
      .mockResolvedValueOnce(jsonResponse(approved));
    const requests = await listRequests({ status: "PENDING" });
    const updated = await decideRequest(requests[0].id, "APPROVED", "Looks good");
    expect(updated.status).toBe("APPROVED");
    expect(updated.reviewer).toBeTruthy();
  });

  it("requires note for rejection", async () => {
    const pending = requestsMock.find((request) => request.status === "PENDING")!;
    fetchMock
      .mockResolvedValueOnce(jsonResponse([pending]))
      .mockResolvedValueOnce(jsonResponse({ error: "Rejection note is required" }, 400));
    await listRequests({ status: "PENDING" });
    await expect(decideRequest(pending.id, "REJECTED")).rejects.toThrow(
      "Rejection note is required",
    );
  });

  it("blocks approvals when a conflict exists", async () => {
    const input = {
      requesterName: "Conflict User",
      requesterEmail: "conflict@uni.edu",
      department: "Math",
      roomId: "room-1",
      purpose: "Conflict session",
      date: "2026-03-05",
      startTime: "10:30",
      endTime: "11:30",
      attendees: 10,
    };
    const imported = { ...requestsMock[0], ...input, id: "request-conflict", status: "PENDING" as const };
    fetchMock
      .mockResolvedValueOnce(jsonResponse([imported], 201))
      .mockResolvedValueOnce(jsonResponse({ error: "Time conflict detected" }, 400));

    const [created] = await createImportedRequests([input]);

    await expect(decideRequest(created.id, "APPROVED", "Approve")).rejects.toThrow(
      "Time conflict",
    );
  });
});
