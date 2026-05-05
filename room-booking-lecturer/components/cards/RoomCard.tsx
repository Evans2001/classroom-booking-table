import Link from "next/link";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Room } from "@/lib/types/room";
import { ROOM_TYPE_LABELS } from "@/lib/utils/constants";

export function RoomCard({ room }: { room: Room }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>
              {room.code} - {room.building} / Floor {room.floor}
            </CardDescription>
          </div>
          <StatusBadge status={room.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">{room.description}</p>
        <p className="text-xs text-slate-500">
          {ROOM_TYPE_LABELS[room.type]} | Capacity {room.capacity}
        </p>
        <Button asChild size="sm">
          <Link href={`/customer/rooms/${room.id}`}>View</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
