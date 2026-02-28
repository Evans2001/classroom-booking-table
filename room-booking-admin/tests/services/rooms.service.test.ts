import { beforeEach, describe, expect, it } from "vitest";

import { __resetRoomsService, createRoom, listRooms, updateRoom } from "@/lib/services/rooms.service";

describe("rooms.service", () => {
  beforeEach(() => {
    __resetRoomsService();
  });

  it("lists seed rooms", async () => {
    const rooms = await listRooms();
    expect(rooms.length).toBeGreaterThan(0);
  });

  it("creates a new room", async () => {
    const created = await createRoom({
      code: "MR-999",
      name: "Test Room",
      building: "Block C",
      floor: 1,
      capacity: 10,
      type: "MEETING_ROOM",
      hasProjector: false,
      hasAc: true,
      status: "ACTIVE",
    });

    const rooms = await listRooms();
    expect(rooms.some((room) => room.id === created.id)).toBe(true);
  });

  it("updates a room", async () => {
    const rooms = await listRooms();
    const target = rooms[0];
    const updated = await updateRoom(target.id, { status: "MAINTENANCE" });
    expect(updated.status).toBe("MAINTENANCE");
  });
});
