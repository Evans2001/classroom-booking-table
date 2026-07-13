import type {
  CreateRoomInput,
  Room,
  RoomFilters,
  UpdateRoomInput,
} from "@/lib/types/room";
import { apiGet, apiSend } from "@/lib/services/api-client";

export async function listRooms(filters?: RoomFilters): Promise<Room[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  const query = params.toString();
  return apiGet<Room[]>(`/api/admin/rooms${query ? `?${query}` : ""}`);
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  try {
    return await apiGet<Room>(`/api/admin/rooms/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Room not found") {
      return undefined;
    }
    throw error;
  }
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  return apiSend<Room>("/api/admin/rooms", "POST", input);
}

export async function updateRoom(id: string, patch: UpdateRoomInput): Promise<Room> {
  return apiSend<Room>(`/api/admin/rooms/${id}`, "PATCH", patch);
}

export async function deleteRoom(id: string): Promise<void> {
  await apiSend<{ success: boolean }>(`/api/admin/rooms/${id}`, "DELETE");
}

export function __resetRoomsService(): void {
  // Database-backed service: no-op retained for backward compatibility.
}
