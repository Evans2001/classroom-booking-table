import { roomsMock } from "@/lib/data/rooms.mock";
import type {
  CreateRoomInput,
  Room,
  RoomFilters,
  UpdateRoomInput,
} from "@/lib/types/room";

let roomsData: Room[] = [...roomsMock];

const LATENCY_MS = 100;

const delay = async () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, LATENCY_MS);
  });

const buildRoomId = () => `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export async function listRooms(filters?: RoomFilters): Promise<Room[]> {
  await delay();

  let filtered = [...roomsData];
  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((room) => room.status === filters.status);
  }
  if (filters?.type && filters.type !== "ALL") {
    filtered = filtered.filter((room) => room.type === filters.type);
  }
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      (room) =>
        room.name.toLowerCase().includes(query) ||
        room.code.toLowerCase().includes(query) ||
        room.building.toLowerCase().includes(query),
    );
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  await delay();
  return roomsData.find((room) => room.id === id);
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  await delay();
  const timestamp = new Date().toISOString();
  const room: Room = {
    ...input,
    id: buildRoomId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  roomsData = [room, ...roomsData];
  return room;
}

export async function updateRoom(id: string, patch: UpdateRoomInput): Promise<Room> {
  await delay();
  const index = roomsData.findIndex((room) => room.id === id);
  if (index === -1) {
    throw new Error("Room not found");
  }
  const updated: Room = {
    ...roomsData[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  roomsData[index] = updated;
  return updated;
}

export function __resetRoomsService(): void {
  roomsData = [...roomsMock];
}
