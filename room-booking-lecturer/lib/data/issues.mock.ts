import type { Issue } from "@/lib/types/issue";

export const issuesMock: Issue[] = [
  {
    id: "is-1",
    roomId: "room-2",
    roomName: "Computer Lab A",
    title: "Projector not turning on",
    description: "Power light blinks but no display.",
    severity: "HIGH",
    status: "IN_PROGRESS",
    createdAt: "2026-02-26T08:30:00.000Z",
    updates: [
      {
        status: "OPEN",
        note: "Issue reported by lecturer.",
        at: "2026-02-26T08:30:00.000Z",
      },
      {
        status: "IN_PROGRESS",
        note: "Maintenance team assigned.",
        at: "2026-02-27T11:00:00.000Z",
      },
    ],
  },
  {
    id: "is-2",
    roomId: "room-1",
    roomName: "Main Lecture Hall",
    title: "Microphone echo issue",
    description: "Audio feedback starts when volume is above medium.",
    severity: "MEDIUM",
    status: "OPEN",
    createdAt: "2026-02-28T06:00:00.000Z",
    updates: [
      {
        status: "OPEN",
        note: "Issue reported by faculty.",
        at: "2026-02-28T06:00:00.000Z",
      },
    ],
  },
  {
    id: "is-3",
    roomId: "room-3",
    roomName: "Board Meeting Room",
    title: "Ceiling light flicker",
    description: "One light panel was flickering during meetings.",
    severity: "LOW",
    status: "RESOLVED",
    createdAt: "2026-01-30T05:45:00.000Z",
    updates: [
      {
        status: "OPEN",
        note: "Issue reported by lecturer.",
        at: "2026-01-30T05:45:00.000Z",
      },
      {
        status: "RESOLVED",
        note: "Electrical maintenance completed.",
        at: "2026-02-02T09:20:00.000Z",
      },
    ],
  },
];
