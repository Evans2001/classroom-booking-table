"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { RoomEditModal } from "@/components/modals/RoomEditModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/common/ToastProvider";
import { getRoomById, updateRoom } from "@/lib/services/rooms.service";
import type { Room, UpdateRoomInput } from "@/lib/types/room";
import { ROOM_TYPE_LABELS } from "@/lib/utils/constants";
import { formatDateTime } from "@/lib/utils/format";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadRoom() {
      setLoading(true);
      const data = await getRoomById(params.id);
      setRoom(data ?? null);
      setLoading(false);
    }
    void loadRoom();
  }, [params.id]);

  const handleUpdate = async (values: UpdateRoomInput) => {
    if (!room) return;
    const updated = await updateRoom(room.id, values);
    setRoom(updated);
    showToast("Room updated", "Room details were saved successfully.", "success");
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading room details...</p>;
  }

  if (!room) {
    return (
      <EmptyState
        title="Room not found"
        description="The room ID does not match any existing record."
        action={
          <Link href="/admin/rooms" className="text-sm font-medium text-blue-700 hover:underline">
            Back to rooms
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>
              {room.code} - {room.building} / Floor {room.floor}
            </CardDescription>
          </div>
          <Button onClick={() => setEditOpen(true)}>Edit Room</Button>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="font-medium text-slate-900">Type:</span> {ROOM_TYPE_LABELS[room.type]}
          </p>
          <p>
            <span className="font-medium text-slate-900">Capacity:</span> {room.capacity}
          </p>
          <p>
            <span className="font-medium text-slate-900">Projector:</span>{" "}
            {room.hasProjector ? "Available" : "Not available"}
          </p>
          <p>
            <span className="font-medium text-slate-900">Air conditioning:</span>{" "}
            {room.hasAc ? "Available" : "Not available"}
          </p>
          <p>
            <span className="font-medium text-slate-900">Last updated:</span>{" "}
            {formatDateTime(room.updatedAt)}
          </p>
        </CardContent>
      </Card>

      <RoomEditModal open={editOpen} onClose={() => setEditOpen(false)} room={room} onSubmit={handleUpdate} />
    </div>
  );
}
