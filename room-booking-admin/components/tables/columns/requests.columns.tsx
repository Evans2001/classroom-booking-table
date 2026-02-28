import type { DataColumn } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { BookingRequest } from "@/lib/types/request";
import { formatDate, formatTimeRange } from "@/lib/utils/format";

export const requestsColumns: DataColumn<BookingRequest>[] = [
  {
    key: "requester",
    header: "Requester",
    render: (request) => (
      <div>
        <p className="font-medium text-slate-900">{request.requesterName}</p>
        <p className="text-xs text-slate-500">{request.department}</p>
      </div>
    ),
  },
  {
    key: "purpose",
    header: "Purpose",
    render: (request) => request.purpose,
  },
  {
    key: "date",
    header: "Date",
    render: (request) => (
      <div>
        <p>{formatDate(request.date)}</p>
        <p className="text-xs text-slate-500">{formatTimeRange(request.startTime, request.endTime)}</p>
      </div>
    ),
  },
  {
    key: "room",
    header: "Room ID",
    render: (request) => request.roomId,
  },
  {
    key: "status",
    header: "Status",
    render: (request) => <StatusBadge status={request.status} />,
  },
];
