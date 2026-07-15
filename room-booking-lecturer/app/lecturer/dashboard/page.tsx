"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, AlertCircle, Building2, Plus, Clock, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { listMyBookings } from "@/lib/services/bookings.service";
import { listMyIssues } from "@/lib/services/issues.service";
import { listRooms } from "@/lib/services/rooms.service";
import type { Booking } from "@/lib/types/booking";

export default function LecturerDashboardPage() {
  const [roomsCount, setRoomsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [issuesCount, setIssuesCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [lecturerName, setLecturerName] = useState("Lecturer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLecturerName(sessionStorage.getItem("lecturer_account_name") ?? "Lecturer");

    async function loadData() {
      try {
        const [rooms, bookings, issues] = await Promise.all([
          listRooms(),
          listMyBookings(),
          listMyIssues(),
        ]);
        setRoomsCount(rooms.length);
        setBookingsCount(bookings.length);
        setIssuesCount(issues.length);
        
        // Get the 3 most recent active/pending bookings
        const activeBookings = bookings.filter(b => b.status === "PENDING" || b.status === "APPROVED");
        setRecentBookings(activeBookings.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-[#7a393e] to-[#4a1c20] p-6 text-white shadow-xl shadow-brand-primary/20">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand-accent/20 blur-2xl" />
        
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Hello, {lecturerName}</h2>
            <p className="mt-1 text-sm font-medium text-white/80">Manage your spaces and report issues seamlessly.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button asChild size="sm" variant="ghost" className="w-full bg-white/20 text-white hover:bg-white/30 hover:text-white backdrop-blur-md">
              <Link href="/lecturer/bookings/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Book Room</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="w-full bg-white/5 text-white hover:bg-white/10 hover:text-white border border-white/20 backdrop-blur-md">
              <Link href="/lecturer/issues/new" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Report Issue</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Overview</h3>
        <div className="grid grid-cols-3 gap-3">
          <Card className="flex flex-col items-center justify-center p-4">
            <div className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{loading ? "-" : roomsCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rooms</p>
          </Card>
          
          <Card className="flex flex-col items-center justify-center p-4 border-brand-primary/20 bg-brand-primary/5">
            <div className="mb-2 rounded-full bg-brand-primary/10 p-2 text-brand-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-brand-primary">{loading ? "-" : bookingsCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary/70">Bookings</p>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4">
            <div className="mb-2 rounded-full bg-rose-100 p-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{loading ? "-" : issuesCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Issues</p>
          </Card>
        </div>
      </div>

      {/* Upcoming/Recent Bookings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Upcoming Bookings</h3>
          <Link href="/lecturer/bookings" className="text-xs font-semibold text-brand-primary hover:underline flex items-center">
            View All <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            recentBookings.map(booking => (
              <Card key={booking.id} className="overflow-hidden p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-primary/5 text-brand-primary">
                    <span className="text-[10px] font-bold uppercase">{new Date(booking.startAt).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(booking.startAt).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-bold text-slate-900">{booking.roomName}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {new Date(booking.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="flex flex-col items-center justify-center py-8 text-center border-dashed">
              <CalendarDays className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-900">No upcoming bookings</p>
              <p className="text-xs text-slate-500">You don&apos;t have any pending or approved bookings.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
