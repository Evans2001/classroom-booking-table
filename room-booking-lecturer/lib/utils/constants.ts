import type { BookingStatus } from "@/lib/types/booking";
import type { IssueSeverity, IssueStatus } from "@/lib/types/issue";
import type { RoomStatus, RoomType } from "@/lib/types/room";

export const AUTH_COOKIE_NAME = "rb_customer_session";
export const AUTH_COOKIE_VALUE = "1";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 8;

export const DEMO_USER_EMAIL = "student@eng.ruh.ac.lk";
export const DEMO_USER_PASSWORD = "Student@123";

export const MOBILE_NAV_ITEMS = [
  { href: "/customer/dashboard", label: "Home" },
  { href: "/customer/rooms", label: "Rooms" },
  { href: "/customer/bookings", label: "Bookings" },
  { href: "/customer/calendar", label: "Calendar" },
  { href: "/customer/issues", label: "Issues" },
  { href: "/customer/profile", label: "Profile" },
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
};

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
