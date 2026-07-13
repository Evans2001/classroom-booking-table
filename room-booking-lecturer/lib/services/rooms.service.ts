import type { Room } from "@/lib/types/room";
import { apiGet } from "@/lib/services/api-client";

export async function listRooms(): Promise<Room[]> {
  return apiGet<Room[]>("/api/lecturer/rooms");
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  try {
    return await apiGet<Room>(`/api/lecturer/rooms/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Room not found") {
      return undefined;
    }
    throw error;
  }
}
