"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CreateRoomInput, Room, RoomStatus, RoomType } from "@/lib/types/room";
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from "@/lib/utils/constants";

interface RoomFormProps {
  initialValues?: Room | CreateRoomInput;
  submitLabel?: string;
  onSubmit: (values: CreateRoomInput) => Promise<void> | void;
}

const defaultValues: CreateRoomInput = {
  code: "",
  name: "",
  building: "",
  floor: 1,
  capacity: 1,
  type: "LECTURE_HALL",
  hasProjector: false,
  hasAc: false,
  status: "ACTIVE",
};

export function RoomForm({ initialValues, submitLabel = "Save Room", onSubmit }: RoomFormProps) {
  const [values, setValues] = useState<CreateRoomInput>({
    ...defaultValues,
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = <K extends keyof CreateRoomInput>(key: K, value: CreateRoomInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="code">Room Code</Label>
        <Input
          id="code"
          value={values.code}
          onChange={(event) => setField("code", event.target.value)}
          placeholder="LH-101"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">Room Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="Main Lecture Hall"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="building">Building</Label>
        <Input
          id="building"
          value={values.building}
          onChange={(event) => setField("building", event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="floor">Floor</Label>
        <Input
          id="floor"
          type="number"
          min={0}
          value={values.floor}
          onChange={(event) => setField("floor", Number(event.target.value))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          value={values.capacity}
          onChange={(event) => setField("capacity", Number(event.target.value))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Room Type</Label>
        <Select
          id="type"
          value={values.type}
          options={[
            { label: ROOM_TYPE_LABELS.LECTURE_HALL, value: "LECTURE_HALL" },
            { label: ROOM_TYPE_LABELS.LAB, value: "LAB" },
            { label: ROOM_TYPE_LABELS.MEETING_ROOM, value: "MEETING_ROOM" },
          ]}
          onChange={(event) => setField("type", event.target.value as RoomType)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={values.status}
          options={[
            { label: ROOM_STATUS_LABELS.ACTIVE, value: "ACTIVE" },
            { label: ROOM_STATUS_LABELS.MAINTENANCE, value: "MAINTENANCE" },
            { label: ROOM_STATUS_LABELS.INACTIVE, value: "INACTIVE" },
          ]}
          onChange={(event) => setField("status", event.target.value as RoomStatus)}
        />
      </div>
      <div className="space-y-2">
        <Label>Facilities</Label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.hasProjector}
            onChange={(event) => setField("hasProjector", event.target.checked)}
          />
          Projector available
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.hasAc}
            onChange={(event) => setField("hasAc", event.target.checked)}
          />
          Air conditioning
        </label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
