"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, MapPin, CalendarClock, Users, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
  initialValues?: BookingInput;
  availabilityExcludeBookingId?: string;
  submitLabel?: string;
  onSubmit: (value: BookingInput) => Promise<void> | void;
}

type AvailabilityState = "idle" | "checking" | "available" | "approval_required" | "unavailable";

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function BookingRequestForm({
  rooms,
  defaultRoomId,
  initialValues,
  availabilityExcludeBookingId,
  submitLabel = "Book Room",
  onSubmit,
}: BookingRequestFormProps) {
  const buildings = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.building))).sort(),
    [rooms],
  );
  const initialRoom = rooms.find((room) => room.id === (initialValues?.roomId ?? defaultRoomId)) ?? rooms[0];
  const [building, setBuilding] = useState(initialRoom?.building ?? buildings[0] ?? "");
  const [form, setForm] = useState<BookingInput>({
    roomId: initialValues?.roomId ?? initialRoom?.id ?? "",
    moduleName: initialValues?.moduleName ?? "",
    startAt: initialValues?.startAt ? toDateTimeLocal(initialValues.startAt) : "",
    endAt: initialValues?.endAt ? toDateTimeLocal(initialValues.endAt) : "",
    purpose: initialValues?.purpose ?? "",
    attendees: initialValues?.attendees ?? 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose date & time to verify.");

  const minStartAt = useMemo(() => getMinBookingDateTimeInputValue(), []);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => room.building === building),
    [rooms, building],
  );
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.roomId),
    [form.roomId, rooms],
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
      setAvailabilityMessage("Choose date & time to verify.");
      return;
    }

    let active = true;
    setAvailabilityState("checking");
    setAvailabilityMessage("Checking room schedule...");

    const timer = setTimeout(async () => {
      const result = await checkRoomAvailability({
        roomId: form.roomId,
        startAt: form.startAt,
        endAt: form.endAt,
        excludeBookingId: availabilityExcludeBookingId,
      });
      if (!active) return;
      setAvailabilityState(result.requiresApproval ? "approval_required" : result.available ? "available" : "unavailable");
      setAvailabilityMessage(result.message);
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [availabilityExcludeBookingId, form.roomId, form.startAt, form.endAt]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (availabilityState !== "available" && availabilityState !== "approval_required") {
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
    <form className="space-y-5" onSubmit={submit}>
      
      {/* Location Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <Building2 className="h-4 w-4" /> Location
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            value={building}
            onChange={(event) => setBuilding(event.target.value)}
            options={buildings.map((item) => ({ value: item, label: item }))}
            className="bg-slate-50"
          />
          <Select
            value={form.roomId}
            onChange={(event) => setForm((previous) => ({ ...previous, roomId: event.target.value }))}
            options={filteredRooms.map((room) => ({
              value: room.id,
              label: `${room.code} - ${room.name}`,
            }))}
            className="bg-slate-50 font-medium"
          />
        </div>
      </div>

      {/* Date & Time Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <CalendarClock className="h-4 w-4" /> Date & Time
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <label className="absolute left-3 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Time</label>
            <Input
              type="datetime-local"
              required
              min={minStartAt}
              value={form.startAt}
              onChange={(event) => setForm((previous) => ({ ...previous, startAt: event.target.value }))}
              className="pt-6 pb-2 h-14 bg-slate-50 text-sm font-bold"
            />
          </div>
          <div className="relative">
            <label className="absolute left-3 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">End Time</label>
            <Input
              type="datetime-local"
              required
              min={form.startAt || minStartAt}
              value={form.endAt}
              onChange={(event) => setForm((previous) => ({ ...previous, endAt: event.target.value }))}
              className="pt-6 pb-2 h-14 bg-slate-50 text-sm font-bold"
            />
          </div>
        </div>
      </div>

      {/* Availability Status Box */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
          availabilityState === "available"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
            : availabilityState === "approval_required"
              ? "border-amber-200 bg-amber-50 text-amber-900 shadow-sm"
            : availabilityState === "unavailable"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : availabilityState === "checking"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {availabilityState === "available" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {availabilityState === "approval_required" && <AlertCircle className="h-5 w-5 text-amber-600" />}
          {availabilityState === "unavailable" && <AlertCircle className="h-5 w-5 text-rose-600" />}
          {availabilityState === "checking" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          {availabilityState === "idle" && <MapPin className="h-5 w-5 text-slate-400" />}
        </div>
        <div>
          <h4 className="text-sm font-bold leading-none mb-1">
            {availabilityState === "available" ? "Room Available" : 
             availabilityState === "approval_required" ? "Admin Approval Required" :
             availabilityState === "unavailable" ? "Unavailable" : 
             availabilityState === "checking" ? "Verifying..." : "Check Availability"}
          </h4>
          <p className="text-xs font-medium opacity-90">{availabilityMessage}</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <FileText className="h-4 w-4" /> Details
        </div>
        <Input
          required
          value={form.moduleName}
          onChange={(event) => setForm((previous) => ({ ...previous, moduleName: event.target.value }))}
          placeholder="Module name"
          className="h-12 bg-slate-50"
        />
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="number"
            min={1}
            required
            value={form.attendees}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, attendees: Number(event.target.value) }))
            }
            placeholder={
              selectedRoom
                ? `Number of attendees (Room capacity: ${selectedRoom.capacity})`
                : "Number of attendees"
            }
            className="pl-10 h-12 bg-slate-50"
          />
        </div>
        {selectedRoom ? (
          <p className="text-xs font-medium text-slate-500">
            Room capacity: {selectedRoom.capacity} seats
          </p>
        ) : null}
        <Textarea
          required
          value={form.purpose}
          onChange={(event) => setForm((previous) => ({ ...previous, purpose: event.target.value }))}
          placeholder="What is the purpose of this booking?"
          className="bg-slate-50 border-slate-200 min-h-[100px]"
        />
      </div>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 p-4 pb-6 backdrop-blur-md border-t border-slate-100 sm:static sm:bg-transparent sm:p-0 sm:border-none sm:backdrop-blur-none sm:mt-6">
        <div className="mx-auto max-w-md">
          <Button 
            type="submit" 
            disabled={submitting || !["available", "approval_required"].includes(availabilityState)} 
            className="w-full h-14 rounded-xl shadow-lg shadow-brand-primary/20 text-base"
          >
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
