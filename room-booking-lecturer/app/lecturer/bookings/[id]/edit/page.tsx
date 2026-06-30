"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft } from "lucide-react";

import { useToast } from "@/components/common/ToastProvider";
import { EmptyState } from "@/components/common/EmptyState";
import { BookingRequestForm } from "@/components/forms/BookingRequestForm";
import { Button } from "@/components/ui/button";
import {
  getBookingById,
  updateBookingRequest,
} from "@/lib/services/bookings.service";
import { listRooms } from "@/lib/services/rooms.service";
import type { Booking, BookingInput } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";

export default function EditBookingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [bookingData, roomsData] = await Promise.all([
        getBookingById(params.id),
        listRooms(),
      ]);
      setBooking(bookingData ?? null);
      setRooms(roomsData);
      setLoading(false);
    }

    void loadData();
  }, [params.id]);

  const initialValues = useMemo<BookingInput | undefined>(() => {
    if (!booking) return undefined;

    return {
      roomId: booking.roomId,
      moduleName: booking.moduleName,
      startAt: booking.startAt,
      endAt: booking.endAt,
      purpose: booking.purpose,
      attendees: booking.attendees,
    };
  }, [booking]);

  const submit = async (value: BookingInput) => {
    try {
      await updateBookingRequest(params.id, value);
      showToast("Booking updated", "Your updated booking is pending approval.", "success");
      router.push("/lecturer/bookings");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update booking.";
      showToast("Update blocked", message, "error");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <Link href="/lecturer/bookings" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Bookings
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Edit Booking</h1>
          <p className="text-sm font-medium text-slate-500">Update room, time, or request details.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        ) : booking && initialValues && rooms.length ? (
          <BookingRequestForm
            rooms={rooms}
            initialValues={initialValues}
            availabilityExcludeBookingId={booking.id}
            submitLabel="Save Booking Changes"
            onSubmit={submit}
          />
        ) : (
          <EmptyState
            title="Booking not found"
            description="This booking is no longer available."
            action={
              <Button asChild className="mt-4 rounded-xl px-8 shadow-lg shadow-brand-primary/20">
                <Link href="/lecturer/bookings">Back to Bookings</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
