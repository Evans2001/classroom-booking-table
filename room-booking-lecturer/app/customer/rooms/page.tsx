"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { RoomCard } from "@/components/cards/RoomCard";
import { Input } from "@/components/ui/input";
import { listRooms } from "@/lib/services/rooms.service";
import type { Room } from "@/lib/types/room";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await listRooms();
      setRooms(data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const filtered = rooms.filter((room) =>
    `${room.name} ${room.code} ${room.building}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search rooms..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {loading ? <p className="text-sm text-slate-500">Loading rooms...</p> : null}
      {!loading && !filtered.length ? (
        <EmptyState title="No rooms found" description="Try a different search term." />
      ) : null}
      <div className="space-y-3">
        {filtered.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
