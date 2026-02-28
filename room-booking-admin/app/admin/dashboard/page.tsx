"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listIssues } from "@/lib/services/issues.service";
import { listRequests } from "@/lib/services/requests.service";
import { listRooms } from "@/lib/services/rooms.service";
import type { Issue } from "@/lib/types/issue";
import type { BookingRequest } from "@/lib/types/request";
import type { Room } from "@/lib/types/room";
import { formatDateTime } from "@/lib/utils/format";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [roomsResult, requestsResult, issuesResult] = await Promise.all([
        listRooms(),
        listRequests(),
        listIssues(),
      ]);
      setRooms(roomsResult);
      setRequests(requestsResult);
      setIssues(issuesResult);
      setLoading(false);
    }

    void loadData();
  }, []);

  const kpis = useMemo(
    () => ({
      totalRooms: rooms.length,
      activeRooms: rooms.filter((room) => room.status === "ACTIVE").length,
      pendingRequests: requests.filter((request) => request.status === "PENDING").length,
      openIssues: issues.filter(
        (issue) => issue.status === "OPEN" || issue.status === "IN_PROGRESS",
      ).length,
    }),
    [issues, requests, rooms],
  );

  const recentRequests = requests.slice(0, 5);
  const recentIssues = issues.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle>{loading ? "..." : kpis.totalRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Rooms</CardDescription>
            <CardTitle>{loading ? "..." : kpis.activeRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle>{loading ? "..." : kpis.pendingRequests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open Issues</CardDescription>
            <CardTitle>{loading ? "..." : kpis.openIssues}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest booking submissions</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/requests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-900">{request.requesterName}</p>
                <p className="text-xs text-slate-500">
                  {request.purpose} - {request.date} {request.startTime}
                </p>
              </div>
            ))}
            {!recentRequests.length ? (
              <p className="text-sm text-slate-500">No requests available.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>Latest maintenance reports</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/issues">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentIssues.map((issue) => (
              <div key={issue.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                <p className="text-xs text-slate-500">{formatDateTime(issue.reportedAt)}</p>
              </div>
            ))}
            {!recentIssues.length ? (
              <p className="text-sm text-slate-500">No issues available.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
