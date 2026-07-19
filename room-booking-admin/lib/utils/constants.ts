import type { IssueSeverity, IssueStatus } from "@/lib/types/issue";
import type { RequestStatus } from "@/lib/types/request";
import type { RoomStatus, RoomType } from "@/lib/types/room";

export const AUTH_COOKIE_NAME = "rb_admin_session";
export const AUTH_COOKIE_VALUE = "1";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 8;

export const DEMO_ADMIN_EMAIL = "admin@roombooking.local";
export const DEMO_ADMIN_PASSWORD = "Admin@123";
export const DEMO_ADMIN_NAME = "System Admin";

export const SIDEBAR_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/account-requests", label: "Account Requests" },
  { href: "/admin/issues", label: "Issues" },
  { href: "/admin/timetable-import", label: "Timetable Import" },
  { href: "/admin/calendar", label: "Semester Calendar" },
  { href: "/admin/reports", label: "Reports" },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/rooms": "Rooms",
  "/admin/requests": "Requests",
  "/admin/account-requests": "Account Requests",
  "/admin/issues": "Issues",
  "/admin/timetable-import": "Timetable Import",
  "/admin/calendar": "Semester Calendar",
  "/admin/reports": "Reports",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  ACTIVE: "Active",
  MAINTENANCE: "Maintenance",
  INACTIVE: "Inactive",
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
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
  CRITICAL: "Critical",
};

export const DEMO_KPI_THRESHOLDS = {
  HIGH_PENDING_REQUESTS: 5,
  HIGH_OPEN_ISSUES: 5,
};
