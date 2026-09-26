import type { BookingStatus } from "@/lib/types/booking";
import type { IssueSeverity, IssueStatus } from "@/lib/types/issue";
import type { RoomStatus, RoomType } from "@/lib/types/room";

export const AUTH_COOKIE_NAME = "rb_lecturer_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 8;
export const LECTURER_SESSION_STORAGE_KEYS = [
  "lecturer_account_identifier",
  "lecturer_account_name",
  "lecturer_account_department",
  "lecturer_account_position",
  "lecturer_account_id_number",
  "lecturer_session_token",
] as const;

export function isValidLecturerSessionToken(value: string | undefined): value is string {
  return Boolean(value && /^[a-f0-9]{64}$/i.test(value));
}

export const DEMO_USER_EMAIL = "lecturer@eng.ruh.ac.lk";
export const DEMO_USER_PASSWORD = "Lecturer@123";

export const MOBILE_NAV_ITEMS = [
  { href: "/lecturer/dashboard", label: "Home" },
  { href: "/lecturer/rooms", label: "Rooms" },
  { href: "/lecturer/bookings", label: "Bookings" },
  { href: "/lecturer/calendar", label: "Calendar" },
  { href: "/lecturer/issues", label: "Issues" },
  { href: "/lecturer/profile", label: "Profile" },
] as const;

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  LIMITED: "Limited",
  UNAVAILABLE: "Unavailable",
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
