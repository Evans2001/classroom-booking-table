import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRoom, listRooms, updateRoom } from "@/lib/services/rooms.service";
import { roomsMock } from "@/lib/data/rooms.mock";
import { jsonResponse } from "@/tests/helpers/http";

describe("rooms.service", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lists seed rooms", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(roomsMock));
    const rooms = await listRooms();
    expect(rooms).toEqual(roomsMock);
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/rooms", { cache: "no-store" });
  });

  it("creates a new room", async () => {
    const input = {
      code: "MR-999",
      name: "Test Room",
      building: "Block C",
      floor: 1,
      capacity: 10,
      type: "MEETING_ROOM",
      hasProjector: false,
      hasAc: true,
      status: "ACTIVE",
    } as const;
    const createdRoom = { ...roomsMock[0], ...input, id: "room-created" };
    fetchMock.mockResolvedValueOnce(jsonResponse(createdRoom, 201));

    await expect(createRoom(input)).resolves.toEqual(createdRoom);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/rooms",
      expect.objectContaining({ method: "POST", body: JSON.stringify(input) }),
    );
  });

  it("updates a room", async () => {
    const target = roomsMock[0];
    const result = { ...target, status: "MAINTENANCE" as const };
    fetchMock.mockResolvedValueOnce(jsonResponse(result));
    const updated = await updateRoom(target.id, { status: "MAINTENANCE" });
    expect(updated).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/rooms/${target.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
