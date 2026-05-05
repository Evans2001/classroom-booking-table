import { roomsMock } from "@/lib/data/rooms.mock";
import type { Room } from "@/lib/types/room";

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 80));

export async function listRooms(): Promise<Room[]> {
  await wait();
  return [...roomsMock];
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  await wait();
  return roomsMock.find((room) => room.id === id);
}
