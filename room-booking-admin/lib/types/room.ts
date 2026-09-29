export type RoomStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";
export type RoomType = "LECTURE_HALL" | "LAB" | "MEETING_ROOM";

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  capacity: number;
  type: RoomType;
  hasProjector: boolean;
  hasAc: boolean;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoomFilters {
  search?: string;
  status?: RoomStatus | "ALL";
  type?: RoomType | "ALL";
}

export type CreateRoomInput = Omit<Room, "id" | "roomNumber" | "createdAt" | "updatedAt">;
export type UpdateRoomInput = Partial<CreateRoomInput>;
