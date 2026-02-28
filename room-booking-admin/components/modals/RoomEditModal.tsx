"use client";

import { Dialog } from "@/components/ui/dialog";
import { RoomForm } from "@/components/forms/RoomForm";
import type { CreateRoomInput, Room, UpdateRoomInput } from "@/lib/types/room";

interface RoomEditModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  onSubmit: (values: UpdateRoomInput) => Promise<void>;
}

export function RoomEditModal({ open, onClose, room, onSubmit }: RoomEditModalProps) {
  const handleSubmit = async (values: CreateRoomInput) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Edit Room" description={`Update ${room.name}.`}>
      <RoomForm initialValues={room} submitLabel="Save Changes" onSubmit={handleSubmit} />
    </Dialog>
  );
}
