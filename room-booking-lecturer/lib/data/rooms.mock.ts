import type { Room } from "@/lib/types/room";

export const roomsMock: Room[] = [
  {
    id: "room-1",
    roomNumber: "R-001",
    name: "Main Lecture Hall",
    capacity: 160,
    type: "LECTURE_HALL",
    status: "AVAILABLE",
    facilities: ["Projector", "Sound System", "WiFi"],
    description: "Large hall for major lectures and events.",
  },
  {
    id: "room-2",
    roomNumber: "R-002",
    name: "Computer Lab A",
    capacity: 45,
    type: "LAB",
    status: "LIMITED",
    facilities: ["Desktop PCs", "Projector", "AC"],
    description: "Computer lab with fixed workstation setup.",
  },
  {
    id: "room-3",
    roomNumber: "R-003",
    name: "Board Meeting Room",
    capacity: 20,
    type: "MEETING_ROOM",
    status: "AVAILABLE",
    facilities: ["TV Display", "Video Conferencing", "AC"],
    description: "Quiet room optimized for meetings and interviews.",
  },
  {
    id: "room-4",
    roomNumber: "R-004",
    name: "South Lecture Hall",
    capacity: 120,
    type: "LECTURE_HALL",
    status: "UNAVAILABLE",
    facilities: ["Projector"],
    description: "Under maintenance this week.",
  },
];
