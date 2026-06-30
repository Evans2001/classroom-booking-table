"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarPlus, ChevronLeft } from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/common/ToastProvider";
import { BookingRequestForm } from "@/components/forms/BookingRequestForm";
import { listRooms } from "@/lib/services/rooms.service";
import { createBookingRequest } from "@/lib/services/bookings.service";
import type { BookingInput } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";

export default function NewBookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get("roomId") ?? undefined;
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await listRooms();
      setRooms(data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const submit = async (value: BookingInput) => {
    try {
      await createBookingRequest(value);
      showToast("Pending your request", "Room is available and request was submitted.", "success");
      router.push("/lecturer/bookings");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit booking.";
      showToast("Booking blocked", message, "error");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Action Bar */}
      <Link href="/lecturer/bookings" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Bookings
      </Link>

      {/* Hero Title */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <CalendarPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Request Space</h1>
          <p className="text-sm font-medium text-slate-500">Fill in details for admin approval.</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        ) : rooms.length ? (
          <BookingRequestForm rooms={rooms} defaultRoomId={defaultRoomId} onSubmit={submit} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-slate-500">No rooms available for booking.</p>
          </div>
        )}
      </div>
    </div>
  );
}