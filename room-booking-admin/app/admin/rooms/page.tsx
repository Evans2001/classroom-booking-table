"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/components/common/ToastProvider";
import { DataTable, type DataColumn } from "@/components/tables/DataTable";
import { roomsColumns } from "@/components/tables/columns/rooms.columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deleteRoom, listRooms } from "@/lib/services/rooms.service";
import type { Room, RoomStatus, RoomType } from "@/lib/types/room";
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from "@/lib/utils/constants";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RoomStatus | "ALL">("ALL");
  const [type, setType] = useState<RoomType | "ALL">("ALL");
  
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    async function loadRooms() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await listRooms({ search, status, type });
        if (active) setRooms(data);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unable to load rooms.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    const timer = window.setTimeout(() => void loadRooms(), 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, status, type]);

  const handleDelete = async () => {
    if (!roomToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteRoom(roomToDelete.id);
      setRooms((previous) =>
        status !== "ALL" && status !== "INACTIVE"
          ? previous.filter((room) => room.id !== roomToDelete.id)
          : previous.map((room) =>
              room.id === roomToDelete.id ? { ...room, status: "INACTIVE" } : room,
            ),
      );
      showToast("Room archived successfully.", "Existing booking and issue history was preserved.", "success");
    } catch (error) {
      showToast(
        "Failed to archive room.",
        error instanceof Error ? error.message : undefined,
        "error",
      );
    } finally {
      setIsDeleting(false);
      setRoomToDelete(null);
    }
  };

  const columns = useMemo<DataColumn<Room>[]>(
    () => [
      ...roomsColumns,
      {
        key: "actions",
        header: "Actions",
        render: (room) => (
          <div className="flex items-center gap-3">
            <Link href={`/admin/rooms/${room.id}`} className="text-sm font-medium text-blue-700 hover:underline">
              View
            </Link>
            {room.status !== "INACTIVE" ? <button
              type="button"
              onClick={() => setRoomToDelete(room)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 transition-colors rounded-lg hover:bg-red-50 hover:text-red-700"
            >
              Archive
            </button> : null}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:max-w-3xl md:flex-row">
          <Input
            placeholder="Search room, room ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as RoomStatus | "ALL")}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: ROOM_STATUS_LABELS.ACTIVE, value: "ACTIVE" },
              { label: ROOM_STATUS_LABELS.MAINTENANCE, value: "MAINTENANCE" },
              { label: ROOM_STATUS_LABELS.INACTIVE, value: "INACTIVE" },
            ]}
          />
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as RoomType | "ALL")}
            options={[
              { label: "All types", value: "ALL" },
              { label: ROOM_TYPE_LABELS.LECTURE_HALL, value: "LECTURE_HALL" },
              { label: ROOM_TYPE_LABELS.LAB, value: "LAB" },
              { label: ROOM_TYPE_LABELS.MEETING_ROOM, value: "MEETING_ROOM" },
            ]}
          />
        </div>
        <Button asChild>
          <Link href="/admin/rooms/new">New Room</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading rooms...</p>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : rooms.length ? (
        <DataTable columns={columns} data={rooms} rowKey={(room) => room.id} />
      ) : (
        <EmptyState
          title="No rooms found"
          description="Try changing your filters or add a new room."
          action={
            <Button asChild>
              <Link href="/admin/rooms/new">Create Room</Link>
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!roomToDelete}
        title="Archive room"
        description="Archive this room? It will no longer be bookable, while existing booking and issue history is preserved."
        confirmLabel={isDeleting ? "Archiving..." : "Archive"}
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
}
