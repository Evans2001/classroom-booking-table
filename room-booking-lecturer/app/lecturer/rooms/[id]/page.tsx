"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Users, Layers, CalendarDays, CheckCircle2, ChevronLeft, MonitorPlay, Wifi, Video } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRoomById } from "@/lib/services/rooms.service";
import type { Room } from "@/lib/types/room";
import { ROOM_TYPE_LABELS } from "@/lib/utils/constants";

export default function RoomDetailsPage() {
  const params = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getRoomById(params.id);
      setRoom(data ?? null);
      setLoading(false);
    }
    void loadData();
  }, [params.id]);

  if (loading) return (
    <div className="animate-pulse space-y-4 pt-4">
      <div className="h-48 rounded-3xl bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-200" />
    </div>
  );

  if (!room) {
    return (
      <EmptyState
        title="Room not found"
        description="The selected room does not exist."
        action={
          <Button asChild size="sm">
            <Link href="/lecturer/rooms">Back to Rooms</Link>
          </Button>
        }
      />
    );
  }

  // Facility icon mapping
  const getFacilityIcon = (facility: string) => {
    const f = facility.toLowerCase();
    if (f.includes('projector') || f.includes('screen') || f.includes('tv')) return <MonitorPlay className="h-4 w-4" />;
    if (f.includes('wifi') || f.includes('internet')) return <Wifi className="h-4 w-4" />;
    if (f.includes('video') || f.includes('camera')) return <Video className="h-4 w-4" />;
    if (f.includes('board')) return <Layers className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Action Bar */}
      <Link href="/lecturer/rooms" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Rooms
      </Link>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand-primary to-brand-accent" />
        
        <div className="p-6 pt-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">{room.code}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-xs font-semibold text-slate-500">{ROOM_TYPE_LABELS[room.type]}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{room.name}</h1>
            </div>
            <StatusBadge status={room.status} />
          </div>

          <p className="text-sm font-medium leading-relaxed text-slate-600">{room.description}</p>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-col items-center justify-center p-3 text-center">
            <Building2 className="mb-1 h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-900">{room.building}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Bldg</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 text-center">
            <Layers className="mb-1 h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-900">Floor {room.floor}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Level</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 text-center">
            <Users className="mb-1 h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-900">{room.capacity}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Seats</span>
          </div>
        </div>
      </div>

      {/* Facilities Section */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Facilities Included</h3>
        <div className="grid grid-cols-2 gap-3">
          {room.facilities.map((facility, idx) => (
            <Card key={idx} className="flex items-center gap-3 p-3 py-3.5 shadow-sm border-slate-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                {getFacilityIcon(facility)}
              </div>
              <span className="text-sm font-semibold text-slate-700">{facility}</span>
            </Card>
          ))}
          {room.facilities.length === 0 && (
            <div className="col-span-2 text-center p-4 border border-dashed rounded-xl border-slate-200 text-sm text-slate-500">
              No facilities listed for this room.
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/80 pb-4 pt-4 px-4 backdrop-blur-md border-t border-slate-100">
        <div className="mx-auto flex max-w-md gap-3">
          <Button asChild variant="outline" className="w-1/3 bg-white h-12 rounded-xl border-slate-200 shadow-sm text-slate-700 hover:text-action-danger hover:border-action-danger hover:bg-action-danger/5">
            <Link href={`/lecturer/issues/new?roomId=${room.id}`} className="flex flex-col items-center justify-center gap-0.5">
              <span className="text-sm">Report</span>
            </Link>
          </Button>
          <Button asChild className="flex-1 h-12 rounded-xl shadow-lg shadow-brand-primary/20">
            <Link href={`/lecturer/bookings/new?roomId=${room.id}`} className="flex items-center justify-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span className="text-[15px]">Book Room</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
