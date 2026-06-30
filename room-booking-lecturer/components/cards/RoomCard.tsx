import Link from "next/link";
import { Building2, Users, ChevronRight, MonitorPlay } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import type { Room } from "@/lib/types/room";
import { ROOM_TYPE_LABELS } from "@/lib/utils/constants";

export function RoomCard({ room }: { room: Room }) {
  // Determine an icon based on room type
  const TypeIcon = room.type === "LAB" ? MonitorPlay : Users;

  return (
    <Card className="group overflow-hidden p-0 transition-all hover:shadow-xl hover:shadow-brand-primary/5 hover:border-brand-primary/20">
      <Link href={`/lecturer/rooms/${room.id}`} className="block">
        {/* Top Header Section */}
        <div className="relative flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{room.name}</h3>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{room.code}</p>
            </div>
          </div>
          <StatusBadge status={room.status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-px bg-slate-100/50 border-y border-slate-100">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate text-xs font-medium text-slate-600">{room.building}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 border-l border-slate-100">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Up to {room.capacity}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 pt-3">
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{ROOM_TYPE_LABELS[room.type]}</span>
          </div>
          <div className="flex items-center text-xs font-bold text-brand-primary">
            View Details <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
