"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, AlertCircle, FileText, Camera, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { IssueInput, IssueSeverity } from "@/lib/types/issue";
import type { Room } from "@/lib/types/room";

interface IssueReportFormProps {
  rooms: Room[];
  defaultRoomId?: string;
  onSubmit: (input: IssueInput) => Promise<void> | void;
}

export function IssueReportForm({ rooms, defaultRoomId, onSubmit }: IssueReportFormProps) {
  const buildings = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.building))).sort(),
    [rooms],
  );
  const initialRoom = rooms.find((room) => room.id === defaultRoomId) ?? rooms[0];
  const [building, setBuilding] = useState(initialRoom?.building ?? buildings[0] ?? "");
  const [form, setForm] = useState<IssueInput>({
    roomId: initialRoom?.id ?? "",
    title: "",
    description: "",
    severity: "MEDIUM",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => room.building === building),
    [rooms, building],
  );

  useEffect(() => {
    if (!filteredRooms.length) {
      setForm((previous) => ({ ...previous, roomId: "" }));
      return;
    }
    if (!filteredRooms.some((room) => room.id === form.roomId)) {
      setForm((previous) => ({ ...previous, roomId: filteredRooms[0].id }));
    }
  }, [filteredRooms, form.roomId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        imageUrl: form.imageUrl?.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      {/* Location Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <Building2 className="h-4 w-4" /> Location
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            value={building}
            onChange={(event) => setBuilding(event.target.value)}
            options={buildings.map((item) => ({ value: item, label: item }))}
            className="bg-slate-50 h-12"
          />
          <Select
            value={form.roomId}
            onChange={(event) => setForm((previous) => ({ ...previous, roomId: event.target.value }))}
            options={filteredRooms.map((room) => ({ value: room.id, label: `${room.code} - ${room.name}` }))}
            className="bg-slate-50 h-12 font-medium"
          />
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <FileText className="h-4 w-4" /> Problem Details
        </div>
        <Input
          required
          value={form.title}
          onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
          placeholder="Brief title (e.g. Broken Projector)"
          className="bg-slate-50 h-12 font-semibold"
        />
        <Textarea
          required
          value={form.description}
          onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
          placeholder="Describe the issue in detail..."
          className="bg-slate-50 min-h-[120px]"
        />
      </div>

      {/* Severity Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <AlertCircle className="h-4 w-4" /> Severity
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, severity: level }))}
              className={`rounded-xl border p-3 text-xs font-bold uppercase tracking-wider transition-all ${
                form.severity === level
                  ? level === "HIGH" 
                    ? "border-action-danger bg-action-danger/10 text-action-danger ring-2 ring-action-danger/20"
                    : level === "MEDIUM"
                    ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20"
                    : "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Image Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <Camera className="h-4 w-4" /> Attachment (Optional)
        </div>
        <Input
          value={form.imageUrl}
          onChange={(event) => setForm((previous) => ({ ...previous, imageUrl: event.target.value }))}
          placeholder="Paste image URL here"
          className="bg-slate-50 h-12"
        />
      </div>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 p-4 pb-6 backdrop-blur-md border-t border-slate-100 sm:static sm:bg-transparent sm:p-0 sm:border-none sm:backdrop-blur-none sm:mt-6">
        <div className="mx-auto max-w-md">
          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl shadow-lg shadow-action-danger/20 bg-action-danger hover:bg-action-danger/90 text-base" 
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Issue Report"}
          </Button>
        </div>
      </div>
    </form>
  );
}