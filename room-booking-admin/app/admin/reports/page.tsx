"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listIssues } from "@/lib/services/issues.service";
import { listRequests } from "@/lib/services/requests.service";
import type { IssueStatus } from "@/lib/types/issue";
import type { RequestStatus } from "@/lib/types/request";
import { REQUEST_STATUS_LABELS, ISSUE_STATUS_LABELS } from "@/lib/utils/constants";

interface DailySummary {
  date: string;
  requests: number;
  approved: number;
  issues: number;
}

export default function ReportsPage() {
  const [requestStatus, setRequestStatus] = useState<RequestStatus | "ALL">("ALL");
  const [issueStatus, setIssueStatus] = useState<IssueStatus | "ALL">("ALL");
  const [rows, setRows] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [requests, issues] = await Promise.all([
        listRequests({ status: requestStatus }),
        listIssues({ status: issueStatus }),
      ]);

      const map = new Map<string, DailySummary>();
      requests.forEach((request) => {
        const key = request.date;
        const entry = map.get(key) ?? { date: key, requests: 0, approved: 0, issues: 0 };
        entry.requests += 1;
        if (request.status === "APPROVED") {
          entry.approved += 1;
        }
        map.set(key, entry);
      });
      issues.forEach((issue) => {
        const key = issue.reportedAt.slice(0, 10);
        const entry = map.get(key) ?? { date: key, requests: 0, approved: 0, issues: 0 };
        entry.issues += 1;
        map.set(key, entry);
      });

      setRows([...map.values()].sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }
    void loadData();
  }, [issueStatus, requestStatus]);

  const totals = useMemo(
    () => ({
      requestCount: rows.reduce((sum, row) => sum + row.requests, 0),
      approvedCount: rows.reduce((sum, row) => sum + row.approved, 0),
      issueCount: rows.reduce((sum, row) => sum + row.issues, 0),
    }),
    [rows],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Requests</CardDescription>
            <CardTitle>{loading ? "..." : totals.requestCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Approved Requests</CardDescription>
            <CardTitle>{loading ? "..." : totals.approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Reported Issues</CardDescription>
            <CardTitle>{loading ? "..." : totals.issueCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
          <CardDescription>Filter request and issue statuses to adjust report output.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              value={requestStatus}
              onChange={(event) => setRequestStatus(event.target.value as RequestStatus | "ALL")}
              options={[
                { label: "All request statuses", value: "ALL" },
                { label: REQUEST_STATUS_LABELS.PENDING, value: "PENDING" },
                { label: REQUEST_STATUS_LABELS.APPROVED, value: "APPROVED" },
                { label: REQUEST_STATUS_LABELS.REJECTED, value: "REJECTED" },
                { label: REQUEST_STATUS_LABELS.CANCELLED, value: "CANCELLED" },
              ]}
            />
            <Select
              value={issueStatus}
              onChange={(event) => setIssueStatus(event.target.value as IssueStatus | "ALL")}
              options={[
                { label: "All issue statuses", value: "ALL" },
                { label: ISSUE_STATUS_LABELS.OPEN, value: "OPEN" },
                { label: ISSUE_STATUS_LABELS.IN_PROGRESS, value: "IN_PROGRESS" },
                { label: ISSUE_STATUS_LABELS.RESOLVED, value: "RESOLVED" },
                { label: ISSUE_STATUS_LABELS.CLOSED, value: "CLOSED" },
              ]}
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading report...</p>
          ) : rows.length ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Approval Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const ratio = row.requests ? row.approved / row.requests : 0;
                    const trend = ratio >= 0.7 ? "APPROVED" : ratio >= 0.4 ? "PENDING" : "REJECTED";
                    return (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.requests}</TableCell>
                        <TableCell>{row.approved}</TableCell>
                        <TableCell>{row.issues}</TableCell>
                        <TableCell>
                          <StatusBadge status={trend} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No report rows" description="Adjust filters to include more records." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
