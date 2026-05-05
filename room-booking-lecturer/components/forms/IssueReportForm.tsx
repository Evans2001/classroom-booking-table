"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

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
    <form className="space-y-3" onSubmit={submit}>
      <Select
        value={building}
        onChange={(event) => setBuilding(event.target.value)}
        options={buildings.map((item) => ({ value: item, label: item }))}
      />
      <Select
        value={form.roomId}
        onChange={(event) => setForm((previous) => ({ ...previous, roomId: event.target.value }))}
        options={filteredRooms.map((room) => ({ value: room.id, label: `${room.code} - ${room.name}` }))}
      />
      <Input
        required
        value={form.title}
        onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
        placeholder="Issue title"
      />
      <Textarea
        required
        value={form.description}
        onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
        placeholder="Describe the problem"
      />
      <Select
        value={form.severity}
        onChange={(event) =>
          setForm((previous) => ({ ...previous, severity: event.target.value as IssueSeverity }))
        }
        options={[
          { value: "LOW", label: "Low" },
          { value: "MEDIUM", label: "Medium" },
          { value: "HIGH", label: "High" },
        ]}
      />
      <Input
        value={form.imageUrl}
        onChange={(event) => setForm((previous) => ({ ...previous, imageUrl: event.target.value }))}
        placeholder="Optional image URL"
      />
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Issue"}
      </Button>
    </form>
  );
}
