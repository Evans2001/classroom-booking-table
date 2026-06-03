"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Filter } from "lucide-react";

import { BookingCard } from "@/components/cards/BookingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { listMyBookings } from "@/lib/services/bookings.service";
import type { Booking, BookingStatus } from "@/lib/types/booking";

const STATUS_FILTERS: Array<{ key: BookingStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [historyDays, setHistoryDays] = useState(7);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    async function loadData() {
      const data = await listMyBookings();
      setBookings(data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const minSubmittedAt = new Date(now);
    minSubmittedAt.setDate(now.getDate() - historyDays);

    return bookings.filter((booking) => {
      if (statusFilter !== "ALL" && booking.status !== statusFilter) {
        return false;
      }
      return new Date(booking.submittedAt) >= minSubmittedAt;
    });
  }, [bookings, historyDays, statusFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMoreInWindow = filtered.length > visible.length;
  const hasOlderHistory = bookings.some((booking) => {
    const now = new Date();
    const minSubmittedAt = new Date(now);
    minSubmittedAt.setDate(now.getDate() - historyDays);
    return new Date(booking.submittedAt) < minSubmittedAt;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary p-6 text-white shadow-lg">
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">My Bookings</h2>
            <p className="text-sm font-medium text-white/80">Track and manage your spaces.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="sticky top-[72px] z-20 -mx-4 bg-white/80 px-4 py-2 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`relative flex-none rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  statusFilter === item.key
                    ? "bg-white text-brand-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setStatusFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Last {historyDays} Days
        </h3>
        <span className="text-xs font-semibold text-slate-400">{filtered.length} found</span>
      </div>

      {/* Main List Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : null}

        {!loading && !bookings.length ? (
          <div className="pt-8">
            <EmptyState
              title="No bookings yet"
              description="Submit your first booking request."
              action={
                <Button asChild className="mt-4 rounded-xl px-8 shadow-lg shadow-brand-primary/20">
                  <Link href="/customer/bookings/new">Book a Room</Link>
                </Button>
              }
            />
          </div>
        ) : !loading && !visible.length ? (
          <div className="pt-8">
            <EmptyState
              title="No bookings in this period"
              description="Change your status filter or load older records."
            />
          </div>
        ) : null}

        {visible.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>

      {/* Pagination Actions */}
      <div className="space-y-3 pt-2">
        {hasMoreInWindow ? (
          <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold" onClick={() => setVisibleCount((value) => value + 5)}>
            Load More Requests
          </Button>
        ) : null}

        {!hasMoreInWindow && hasOlderHistory ? (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold bg-slate-50"
            onClick={() => {
              setHistoryDays((value) => value + 7);
              setVisibleCount((value) => value + 5);
            }}
          >
            Load Older History
          </Button>
        ) : null}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[88px] right-4 z-40 pb-safe">
        <Link 
          href="/customer/bookings/new"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/40 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}