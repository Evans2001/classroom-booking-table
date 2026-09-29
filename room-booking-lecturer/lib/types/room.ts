export type RoomStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
export type RoomType = "LECTURE_HALL" | "LAB" | "MEETING_ROOM";

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
  facilities: string[];
  description: string;
}
