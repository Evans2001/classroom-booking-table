import type { DataColumn } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Issue } from "@/lib/types/issue";
import { formatDate } from "@/lib/utils/format";

export const issuesColumns: DataColumn<Issue>[] = [
  {
    key: "title",
    header: "Issue",
    render: (issue) => (
      <div>
        <p className="font-medium text-slate-900">{issue.title}</p>
        <p className="text-xs text-slate-500">{issue.roomId}</p>
      </div>
    ),
  },
  {
    key: "reported",
    header: "Reported",
    render: (issue) => (
      <div>
        <p>{formatDate(issue.reportedAt)}</p>
        <p className="text-xs text-slate-500">{issue.reportedBy}</p>
      </div>
    ),
  },
  {
    key: "severity",
    header: "Severity",
    render: (issue) => <StatusBadge status={issue.severity} />,
  },
  {
    key: "status",
    header: "Status",
    render: (issue) => <StatusBadge status={issue.status} />,
  },
];
