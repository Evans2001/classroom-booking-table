"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { RoomCard } from "@/components/cards/RoomCard";
import { listRooms } from "@/lib/services/rooms.service";
import type { Room } from "@/lib/types/room";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "LARGE">("ALL");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const data = await listRooms();
        if (active) setRooms(data);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load rooms.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rooms.filter((room) => {
      if (filter === "AVAILABLE" && room.status !== "AVAILABLE") return false;
      if (filter === "LARGE" && room.capacity < 100) return false;
      return `${room.name} ${room.roomNumber} `.toLowerCase().includes(normalizedQuery);
    });
  }, [filter, query, rooms]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header / Search Section */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary p-6 text-white shadow-lg">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Find a Space</h2>
            <p className="text-xs text-white/80 mt-1">Search through available rooms by name or room ID.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Search rooms"
              placeholder="Search by name, room ID..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-accent/30"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {([
          ["ALL", "All rooms"],
          ["AVAILABLE", "Available"],
          ["LARGE", "100+ seats"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`flex-none rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              filter === value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {loading ? "Loading rooms" : `${filtered.length} ${filtered.length === 1 ? "Room" : "Rooms"} Found`}
        </h3>

        {loadError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {loadError}
          </div>
        ) : null}
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : null}

        {!loading && !loadError && !filtered.length ? (
          <EmptyState title="No rooms found" description="Try a different search term." />
        ) : null}

        <div className="space-y-4">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
