import Link from "next/link";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Issue } from "@/lib/types/issue";
import { formatDateTime } from "@/lib/utils/format";

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{issue.title}</CardTitle>
            <CardDescription>{issue.roomName}</CardDescription>
          </div>
          <StatusBadge status={issue.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-600">{issue.description}</p>
        <div className="flex items-center justify-between">
          <StatusBadge status={issue.severity} />
          <p className="text-xs text-slate-500">{formatDateTime(issue.createdAt)}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/customer/issues/${issue.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
