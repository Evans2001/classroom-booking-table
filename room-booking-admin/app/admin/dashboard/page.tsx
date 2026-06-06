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
    <div className="space-y-8">
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-brand-gold">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium text-slate-500">Total Rooms</CardDescription>
            <CardTitle className="text-5xl font-extrabold text-brand-maroon">{loading ? "..." : kpis.totalRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-brand-gold">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium text-slate-500">Active Rooms</CardDescription>
            <CardTitle className="text-5xl font-extrabold text-brand-maroon">{loading ? "..." : kpis.activeRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-brand-gold">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium text-slate-500">Pending Requests</CardDescription>
            <CardTitle className="text-5xl font-extrabold text-brand-maroon">{loading ? "..." : kpis.pendingRequests}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-brand-gold">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium text-slate-500">Open Issues</CardDescription>
            <CardTitle className="text-5xl font-extrabold text-brand-maroon">{loading ? "..." : kpis.openIssues}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-xl text-slate-900">Recent Requests</CardTitle>
              <CardDescription className="text-slate-500">Latest booking submissions</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="ml-4 border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white">
              <Link href="/admin/requests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="group flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 hover:border-slate-300 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{request.requesterName}</p>
                  <span className="rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-medium text-brand-maroon">{request.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {request.purpose}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
                  {request.date} at {request.startTime}
                </p>
              </div>
            ))}
            {!recentRequests.length ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">No requests available.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-xl text-slate-900">Recent Issues</CardTitle>
              <CardDescription className="text-slate-500">Latest maintenance reports</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="ml-4 border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white">
              <Link href="/admin/issues">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {recentIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="group flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 hover:border-slate-300 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">{issue.priority}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500 line-clamp-1">{issue.description}</p>
                <p className="mt-2 text-xs font-medium text-slate-400 group-hover:text-slate-500 transition-colors">{formatDateTime(issue.reportedAt)}</p>
              </div>
            ))}
            {!recentIssues.length ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">No issues available.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
