import { Badge } from "@/components/ui/badge";
import type { IssueSeverity, IssueStatus } from "@/lib/types/issue";
import type { RequestStatus } from "@/lib/types/request";
import type { RoomStatus } from "@/lib/types/room";
import {
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  ROOM_STATUS_LABELS,
} from "@/lib/utils/constants";

type StatusLike = RoomStatus | RequestStatus | IssueStatus | IssueSeverity;

export function StatusBadge({ status }: { status: StatusLike }) {
  if (status === "ACTIVE" || status === "APPROVED" || status === "RESOLVED" || status === "LOW") {
    return <Badge variant="success">{resolveLabel(status)}</Badge>;
  }
  if (
    status === "PENDING" ||
    status === "IN_PROGRESS" ||
    status === "MAINTENANCE" ||
    status === "MEDIUM"
  ) {
    return <Badge variant="warning">{resolveLabel(status)}</Badge>;
  }
  if (status === "OPEN" || status === "HIGH" || status === "CRITICAL") {
    return <Badge variant="destructive">{resolveLabel(status)}</Badge>;
  }
  return <Badge variant="default">{resolveLabel(status)}</Badge>;
}

function resolveLabel(status: StatusLike): string {
  return (
    (ROOM_STATUS_LABELS as Record<string, string>)[status] ||
    (REQUEST_STATUS_LABELS as Record<string, string>)[status] ||
    (ISSUE_STATUS_LABELS as Record<string, string>)[status] ||
    (ISSUE_SEVERITY_LABELS as Record<string, string>)[status] ||
    status
  );
}
