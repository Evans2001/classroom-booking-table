"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (loading) return <p className="text-sm text-slate-500">Loading room...</p>;
  if (!room) {
    return (
      <EmptyState
        title="Room not found"
        description="The selected room does not exist."
        action={
          <Button asChild size="sm">
            <Link href="/customer/rooms">Back to Rooms</Link>
          </Button>
        }
      />
    );
  }

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
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>{room.description}</p>
        <p>
          <span className="font-medium text-slate-900">Type:</span> {ROOM_TYPE_LABELS[room.type]}
        </p>
        <p>
          <span className="font-medium text-slate-900">Capacity:</span> {room.capacity}
        </p>
        <p>
          <span className="font-medium text-slate-900">Facilities:</span>{" "}
          {room.facilities.join(", ")}
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button asChild variant="outline">
            <Link href={`/customer/issues/new?roomId=${room.id}`}>Report Issue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
