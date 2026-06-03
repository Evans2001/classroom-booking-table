import Link from "next/link";
import { AlertCircle, ChevronRight, MessageSquare, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import type { Issue } from "@/lib/types/issue";
import { formatDateTime } from "@/lib/utils/format";

export function IssueCard({ issue }: { issue: Issue }) {
  const isResolved = issue.status === "RESOLVED";

  return (
    <Card className={`group overflow-hidden p-0 transition-all hover:shadow-xl hover:shadow-action-danger/5 hover:border-action-danger/20 ${isResolved ? "opacity-75 grayscale-[0.3]" : ""}`}>
      <Link href={`/customer/issues/${issue.id}`} className="block">
        <div className="flex p-4 gap-4 items-start">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isResolved ? "bg-slate-100 text-slate-400" : "bg-action-danger/10 text-action-danger"}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 leading-tight truncate group-hover:text-action-danger transition-colors">{issue.title}</h3>
              <div className="shrink-0">
                <StatusBadge status={issue.status} />
              </div>
            </div>
            
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{issue.roomName}</span>
            </div>

            <div className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              {issue.description}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={issue.severity} />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {formatDateTime(issue.createdAt)}
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-action-danger" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}