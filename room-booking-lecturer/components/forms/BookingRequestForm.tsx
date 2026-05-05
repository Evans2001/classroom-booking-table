"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  checkRoomAvailability,
  getMinBookingDateTimeInputValue,
} from "@/lib/services/bookings.service";
import type { BookingInput } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";

interface BookingRequestFormProps {
  rooms: Room[];
  defaultRoomId?: string;
  onSubmit: (value: BookingInput) => Promise<void> | void;
}

type AvailabilityState = "idle" | "checking" | "available" | "unavailable";

export function BookingRequestForm({ rooms, defaultRoomId, onSubmit }: BookingRequestFormProps) {
  const buildings = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.building))).sort(),
    [rooms],
  );
  const initialRoom = rooms.find((room) => room.id === defaultRoomId) ?? rooms[0];
  const [building, setBuilding] = useState(initialRoom?.building ?? buildings[0] ?? "");
  const [form, setForm] = useState<BookingInput>({
    roomId: initialRoom?.id ?? "",
    startAt: "",
    endAt: "",
    purpose: "",
    attendees: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose date/time to check room.");

  const minStartAt = useMemo(() => getMinBookingDateTimeInputValue(), []);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => room.building === building),
    [rooms, building],
  );

  useEffect(() => {
    if (!filteredRooms.length) {
      setForm((previous) => ({ ...previous, roomId: "" }));
      return;
    }
    if (!filteredRooms.some((room) => room.id === form.roomId)) {
      setForm((previous) => ({ ...previous, roomId: filteredRooms[0].id }));
    }
  }, [filteredRooms, form.roomId]);

  useEffect(() => {
    if (!form.roomId || !form.startAt || !form.endAt) {
      setAvailabilityState("idle");
      setAvailabilityMessage("Choose date/time to check room.");
      return;
    }

    let active = true;
    setAvailabilityState("checking");
    setAvailabilityMessage("Checking room availability...");

    const timer = setTimeout(async () => {
      const result = await checkRoomAvailability({
        roomId: form.roomId,
        startAt: form.startAt,
        endAt: form.endAt,
      });
      if (!active) return;
      setAvailabilityState(result.available ? "available" : "unavailable");
      setAvailabilityMessage(result.message);
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.roomId, form.startAt, form.endAt]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (availabilityState !== "available") {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <Select
        value={building}
        onChange={(event) => setBuilding(event.target.value)}
        options={buildings.map((item) => ({ value: item, label: item }))}
      />
      <Select
        value={form.roomId}
        onChange={(event) => setForm((previous) => ({ ...previous, roomId: event.target.value }))}
        options={filteredRooms.map((room) => ({
          value: room.id,
          label: `${room.code} - ${room.name}`,
        }))}
      />
      <div className="grid grid-cols-1 gap-2">
        <Input
          type="datetime-local"
          required
          min={minStartAt}
          value={form.startAt}
          onChange={(event) => setForm((previous) => ({ ...previous, startAt: event.target.value }))}
        />
        <Input
          type="datetime-local"
          required
          min={form.startAt || minStartAt}
          value={form.endAt}
          onChange={(event) => setForm((previous) => ({ ...previous, endAt: event.target.value }))}
        />
      </div>
      <Input
        type="number"
        min={1}
        required
        value={form.attendees}
        onChange={(event) =>
          setForm((previous) => ({ ...previous, attendees: Number(event.target.value) }))
        }
        placeholder="Attendees"
      />
      <Textarea
        required
        value={form.purpose}
        onChange={(event) => setForm((previous) => ({ ...previous, purpose: event.target.value }))}
        placeholder="Purpose of booking"
      />

      <div
        className={`rounded-md border px-3 py-2 text-xs ${
          availabilityState === "available"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : availabilityState === "unavailable"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {availabilityMessage}
      </div>

      <Button type="submit" disabled={submitting || availabilityState !== "available"} className="w-full">
        {submitting ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
