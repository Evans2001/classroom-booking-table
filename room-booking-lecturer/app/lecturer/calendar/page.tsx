"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { listMyBookings } from "@/lib/services/bookings.service";
import { listMySemesterLectures } from "@/lib/services/timetable.service";
import type { Booking } from "@/lib/types/booking";
import type { LecturerTimetableEntry } from "@/lib/types/timetable";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatTimeRange(booking: Booking): string {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);

  return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [semesterLectures, setSemesterLectures] = useState<LecturerTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    async function loadBookings() {
      const [data, lectures] = await Promise.all([listMyBookings(), listMySemesterLectures()]);
      setBookings(data);
      setSemesterLectures(lectures);
      setLoading(false);
    }

    void loadBookings();
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "REJECTED" && booking.status !== "CANCELLED"),
    [bookings],
  );

  const bookingsByDate = useMemo(() => {
    return activeBookings.reduce<Record<string, Booking[]>>((groups, booking) => {
      const key = getDateKey(new Date(booking.startAt));
      groups[key] = [...(groups[key] || []), booking];
      return groups;
    }, {});
  }, [activeBookings]);

  const selectedBookings = useMemo(() => {
    return (bookingsByDate[getDateKey(selectedDate)] || []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [bookingsByDate, selectedDate]);
  const selectedLectures = useMemo(() => semesterLectures
    .filter((lecture) => lecture.dayOfWeek === selectedDate.toLocaleDateString("en-US", { weekday: "long" }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [semesterLectures, selectedDate]);

  const today = startOfDay(new Date());
  const monthLabel = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const moveMonth = (direction: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary p-6 text-white shadow-lg">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
            <p className="text-sm font-medium text-white/80">Check free dates and your booked rooms.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-slate-900">{monthLabel}</h3>
            <p className="text-xs font-semibold text-slate-400">{activeBookings.length} active bookings</p>
          </div>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = getDateKey(day);
            const dayBookings = bookingsByDate[key] || [];
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const hasLecture = semesterLectures.some((lecture) => lecture.dayOfWeek === day.toLocaleDateString("en-US", { weekday: "long" }));
            const hasBooking = dayBookings.length > 0 || hasLecture;
            const isPast = startOfDay(day) < today;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(startOfDay(day))}
                className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl border text-sm font-black transition-all ${
                  isSelected
                    ? "border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : hasBooking
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : isPast
                        ? "border-slate-100 bg-slate-50 text-slate-300"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700"
                } ${isCurrentMonth ? "" : "opacity-40"}`}
              >
                {day.getDate()}
                {hasBooking ? (
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-amber-500"}`} />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Past date
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">{selectedLabel}</h3>
            <p className="text-xs font-semibold text-slate-400">
              {selectedLectures.length} semester lectures · {selectedBookings.length} room bookings
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/lecturer/bookings/new">
              <Plus className="mr-1 h-4 w-4" />
              Book
            </Link>
          </Button>
        </div>

        {!loading && selectedLectures.length ? <div className="space-y-3">{selectedLectures.map((lecture) => <article key={lecture.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h4 className="font-black text-blue-950">{lecture.moduleCode}</h4><p className="mt-1 text-xs font-semibold text-blue-700">{lecture.batch} · {lecture.semester}</p></div><span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">SEMESTER</span></div><div className="mt-3 flex gap-3 text-sm font-semibold text-blue-900"><span>{lecture.startTime} - {lecture.endTime}</span><span>·</span><span>{lecture.roomCode}</span></div></article>)}</div> : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : selectedBookings.length ? (
          <div className="space-y-3">
            {selectedBookings.map((booking) => (
              <article key={booking.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-black leading-tight text-slate-900">{booking.roomName}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{booking.building} - {booking.roomCode}</span>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  <Clock className="h-4 w-4 text-brand-primary" />
                  {formatTimeRange(booking)}
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-brand-primary/5 px-3 py-2 text-sm font-bold text-brand-primary">
                  <BookOpen className="h-4 w-4" />
                  {booking.moduleName}
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">{booking.purpose}</p>
              </article>
            ))}
          </div>
        ) : !selectedLectures.length ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <h4 className="font-black text-emerald-800">Available date</h4>
            <p className="mt-1 text-sm font-medium text-emerald-700">
              You do not have any active bookings on this date.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
