"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { IssueCard } from "@/components/cards/IssueCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { listMyIssues } from "@/lib/services/issues.service";
import type { Issue } from "@/lib/types/issue";

type ConcernFilter = "ALL" | "CONCERNED" | "NOT_CONCERNED";

const concernFilters: Array<{ key: ConcernFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "CONCERNED", label: "Concerned" },
  { key: "NOT_CONCERNED", label: "Not Concerned" },
];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyDays, setHistoryDays] = useState(20);
  const [visibleCount, setVisibleCount] = useState(5);
  const [concernFilter, setConcernFilter] = useState<ConcernFilter>("CONCERNED");

  useEffect(() => {
    async function loadData() {
      const data = await listMyIssues();
      setIssues(data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const minCreatedAt = new Date(now);
    minCreatedAt.setDate(now.getDate() - historyDays);

    return issues.filter((issue) => {
      const createdAt = new Date(issue.createdAt);
      if (createdAt < minCreatedAt) return false;

      if (concernFilter === "CONCERNED") {
        return issue.status !== "RESOLVED";
      }
      if (concernFilter === "NOT_CONCERNED") {
        return issue.status === "RESOLVED";
      }
      return true;
    });
  }, [concernFilter, historyDays, issues]);

  const visible = filtered.slice(0, visibleCount);
  const hasMoreInWindow = filtered.length > visible.length;
  const hasOlderHistory = issues.some((issue) => {
    const now = new Date();
    const minCreatedAt = new Date(now);
    minCreatedAt.setDate(now.getDate() - historyDays);
    return new Date(issue.createdAt) < minCreatedAt;
  });

  if (loading) return <p className="text-sm text-slate-500">Loading issues...</p>;

  if (!issues.length) {
    return (
      <EmptyState
        title="No issues reported"
        description="Use the portal to report classroom problems."
        action={
          <Button asChild size="sm">
            <Link href="/customer/issues/new">Report Issue</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/customer/issues/new">Report Issue</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {concernFilters.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              concernFilter === item.key
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
            onClick={() => setConcernFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Showing records from last {historyDays} days.
      </p>

      {!visible.length ? (
        <EmptyState
          title="No issues in this period"
          description="Adjust concern filter or load older records."
        />
      ) : null}

      {visible.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}

      {hasMoreInWindow ? (
        <Button variant="outline" className="w-full" onClick={() => setVisibleCount((value) => value + 5)}>
          Load More
        </Button>
      ) : null}

      {!hasMoreInWindow && hasOlderHistory ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setHistoryDays((value) => value + 20);
            setVisibleCount((value) => value + 5);
          }}
        >
          Load Older (20 more days)
        </Button>
      ) : null}
    </div>
  );
}
