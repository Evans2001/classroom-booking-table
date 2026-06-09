"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck2,
  DoorOpen,
  Sparkles,
  Wrench,
} from "lucide-react";

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
  const totalPendingWork = kpis.pendingRequests + kpis.openIssues;

  const kpiCards = [
    {
      label: "Total Rooms",
      value: kpis.totalRooms,
      detail: "Registered lecture spaces",
      icon: Building2,
      accent: "bg-[#5E2726]",
    },
    {
      label: "Active Rooms",
      value: kpis.activeRooms,
      detail: "Ready for allocation",
      icon: DoorOpen,
      accent: "bg-emerald-600",
    },
    {
      label: "Pending Requests",
      value: kpis.pendingRequests,
      detail: "Awaiting admin review",
      icon: CalendarCheck2,
      accent: "bg-[#F3C033]",
    },
    {
      label: "Open Issues",
      value: kpis.openIssues,
      detail: "Need maintenance action",
      icon: Wrench,
      accent: "bg-rose-600",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl bg-[#5E2726] text-white shadow-xl shadow-[#5E2726]/20">
        <div className="relative px-6 py-7 sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(243,192,51,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.13),transparent_45%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F3C033]">
                  Admin Dashboard
                </div>
              </div>

              <div>
                <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                  Faculty of Engineering Lecture Room Booking System
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/76 sm:text-base">
                  Monitor lecture spaces, approve booking requests, and keep room issues moving with a clearer
                  command view.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="gap-2 bg-[#F3C033] text-[#281817] hover:bg-[#ffd45d]">
                  <Link href="/admin/requests">
                    Review requests
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#5E2726]">
                  <Link href="/admin/rooms/new">
                    Add room
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F3C033]">Needs Attention</p>
              <p className="mt-3 text-5xl font-black">{loading ? "..." : totalPendingWork}</p>
              <p className="mt-2 text-sm leading-6 text-white/72">Pending requests and active room issues.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden border-0 shadow-lg shadow-slate-200/70">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="font-semibold text-slate-500">{item.label}</CardDescription>
                    <CardTitle className="mt-2 text-4xl font-black text-slate-950">
                      {loading ? "..." : item.value}
                    </CardTitle>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.accent} text-white shadow-md`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <p className="pt-3 text-sm text-slate-500">{item.detail}</p>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg shadow-slate-200/70">
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
                className="group flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#F3C033] hover:bg-[#fffaf0]"
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

        <Card className="border-0 shadow-lg shadow-slate-200/70">
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
                className="group flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    {issue.severity}
                  </span>
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
