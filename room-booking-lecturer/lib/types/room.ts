export type RoomStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
export type RoomType = "LECTURE_HALL" | "LAB" | "MEETING_ROOM";

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
  facilities: string[];
  description: string;
}
