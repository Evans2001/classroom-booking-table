"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Users, Building2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { RoomCard } from "@/components/cards/RoomCard";
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
    <div className="space-y-6 pb-20">
      {/* Header / Search Section */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary p-6 text-white shadow-lg">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Find a Space</h2>
            <p className="text-xs text-white/80 mt-1">Search through available rooms across all buildings.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, code, or building..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-accent/30"
            />
          </div>
        </div>
      </div>

      {/* Quick Filters Placeholder (Visual only for aesthetics, or can implement logic later) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        <button className="flex-none rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
          All Rooms
        </button>
        <button className="flex-none rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300">
          Available Now
        </button>
        <button className="flex-none rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300">
          Large Capacity
        </button>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'Room' : 'Rooms'} Found
        </h3>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : null}

        {!loading && !filtered.length ? (
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