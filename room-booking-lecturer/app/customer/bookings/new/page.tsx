"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/common/ToastProvider";
import { BookingRequestForm } from "@/components/forms/BookingRequestForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBookingRequest } from "@/lib/services/bookings.service";
import { listRooms } from "@/lib/services/rooms.service";
import type { BookingInput } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";

export default function NewBookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get("roomId") ?? undefined;
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const data = await listRooms();
      setRooms(data);
    }
    void loadData();
  }, []);

  const submit = async (value: BookingInput) => {
    try {
      await createBookingRequest(value);
      showToast("Pending your request", "Room is available and request was submitted.", "success");
      router.push("/customer/bookings");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit booking.";
      showToast("Booking blocked", message, "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Booking Request</CardTitle>
        <CardDescription>Fill in details and submit for admin approval.</CardDescription>
      </CardHeader>
      <CardContent>
        {rooms.length ? (
          <BookingRequestForm rooms={rooms} defaultRoomId={defaultRoomId} onSubmit={submit} />
        ) : (
          <p className="text-sm text-slate-500">Loading available rooms...</p>
        )}
      </CardContent>
    </Card>
  );
}
