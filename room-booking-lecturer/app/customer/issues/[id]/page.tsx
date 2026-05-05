"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIssueById } from "@/lib/services/issues.service";
import type { Issue } from "@/lib/types/issue";
import { formatDateTime } from "@/lib/utils/format";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getIssueById(params.id);
      setIssue(data ?? null);
      setLoading(false);
    }
    void loadData();
  }, [params.id]);

  if (loading) return <p className="text-sm text-slate-500">Loading issue...</p>;
  if (!issue) {
    return (
      <EmptyState
        title="Issue not found"
        description="This issue ID is unavailable."
        action={
          <Button asChild size="sm">
            <Link href="/customer/issues">Back to Issues</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
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
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>{issue.description}</p>
          <div className="flex items-center justify-between">
            <StatusBadge status={issue.severity} />
            <p className="text-xs text-slate-500">{formatDateTime(issue.createdAt)}</p>
          </div>
          {issue.imageUrl ? (
            <a href={issue.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700">
              Open attached image
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
          <CardDescription>Latest updates from the admin team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {issue.updates.map((update, index) => (
            <div key={`${update.at}-${index}`} className="rounded-md border border-slate-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <StatusBadge status={update.status} />
                <p className="text-xs text-slate-500">{formatDateTime(update.at)}</p>
              </div>
              <p className="text-sm text-slate-700">{update.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
