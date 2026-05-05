import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/lib/types/booking";
import { formatDateTime, formatDateTimeRange } from "@/lib/utils/format";

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{booking.roomName}</CardTitle>
            <CardDescription>
              {booking.building} - {booking.roomCode}
            </CardDescription>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-slate-600">
        <p>{formatDateTimeRange(booking.startAt, booking.endAt)}</p>
        <p>{booking.purpose}</p>
        <p>Attendees: {booking.attendees}</p>
        <p className="text-xs text-slate-500">Submitted {formatDateTime(booking.submittedAt)}</p>
        {booking.reviewerNote ? (
          <p className="rounded-md bg-slate-50 px-2 py-1 text-xs">Note: {booking.reviewerNote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
