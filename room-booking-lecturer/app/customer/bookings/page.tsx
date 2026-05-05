"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

  if (loading) return <p className="text-sm text-slate-500">Loading bookings...</p>;

  if (!bookings.length) {
    return (
      <EmptyState
        title="No bookings yet"
        description="Submit your first booking request."
        action={
          <Button asChild size="sm">
            <Link href="/customer/bookings/new">New Booking</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/customer/bookings/new">New Booking</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === item.key
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
            onClick={() => setStatusFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Showing submissions from last {historyDays} days.
      </p>

      {!visible.length ? (
        <EmptyState
          title="No bookings in this period"
          description="Change status filter or load older records."
        />
      ) : null}

      {visible.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
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
            setHistoryDays((value) => value + 7);
            setVisibleCount((value) => value + 5);
          }}
        >
          Load Older (7 more days)
        </Button>
      ) : null}
    </div>
  );
}
