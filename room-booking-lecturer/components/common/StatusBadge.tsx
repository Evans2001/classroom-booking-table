import type { BookingStatus } from "@/lib/types/booking";
import type { IssueSeverity, IssueStatus } from "@/lib/types/issue";
import type { RoomStatus } from "@/lib/types/room";
import {
  BOOKING_STATUS_LABELS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_LABELS,
  ROOM_STATUS_LABELS,
} from "@/lib/utils/constants";

type StatusLike = RoomStatus | BookingStatus | IssueStatus | IssueSeverity;

export function StatusBadge({ status }: { status: StatusLike }) {
  let classes = "border-slate-200 bg-slate-100 text-slate-700";
  if (
    status === "APPROVED" ||
    status === "AVAILABLE" ||
    status === "RESOLVED" ||
    status === "LOW"
  ) {
    classes = "border-emerald-200 bg-emerald-100 text-emerald-700";
  } else if (
    status === "PENDING" ||
    status === "LIMITED" ||
    status === "IN_PROGRESS" ||
    status === "MEDIUM"
  ) {
    classes = "border-amber-200 bg-amber-100 text-amber-700";
  } else if (
    status === "REJECTED" ||
    status === "UNAVAILABLE" ||
    status === "OPEN" ||
    status === "HIGH"
  ) {
    classes = "border-rose-200 bg-rose-100 text-rose-700";
  }

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {resolveLabel(status)}
    </span>
  );
}

function resolveLabel(status: StatusLike): string {
  return (
    (ROOM_STATUS_LABELS as Record<string, string>)[status] ||
    (BOOKING_STATUS_LABELS as Record<string, string>)[status] ||
    (ISSUE_STATUS_LABELS as Record<string, string>)[status] ||
    (ISSUE_SEVERITY_LABELS as Record<string, string>)[status] ||
    status
  );
}
