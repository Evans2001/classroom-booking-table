import { CalendarDays, Clock, MapPin, Users, FileText } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import type { Booking } from "@/lib/types/booking";

export function BookingCard({ booking }: { booking: Booking }) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const submitted = new Date(booking.submittedAt);

  return (
    <Card className="group overflow-hidden p-0 transition-all hover:shadow-xl hover:shadow-brand-primary/5 hover:border-brand-primary/20">
      <div className="flex">
        {/* Left Calendar Block */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-slate-100 bg-slate-50/50 p-2 text-center group-hover:bg-brand-primary/5 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
            {start.toLocaleString('en-US', { month: 'short' })}
          </span>
          <span className="text-2xl font-black text-slate-900">
            {start.getDate()}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            {start.toLocaleString('en-US', { weekday: 'short' })}
          </span>
        </div>

        {/* Right Content Block */}
        <div className="flex-1 p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{booking.roomName}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{booking.building} • {booking.roomCode}</span>
              </div>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="font-semibold text-slate-700">
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{booking.attendees} Attendees</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="line-clamp-2 leading-relaxed">{booking.purpose}</span>
            </div>
          </div>

          {booking.reviewerNote && (
            <div className="mt-3 border-l-2 border-brand-accent bg-brand-accent/5 px-3 py-2 text-xs text-slate-700">
              <span className="font-bold text-brand-primary">Note:</span> {booking.reviewerNote}
            </div>
          )}

          <div className="mt-3 text-right">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Submitted {submitted.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}