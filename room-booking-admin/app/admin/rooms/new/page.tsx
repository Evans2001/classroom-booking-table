"use client";

import { useRouter } from "next/navigation";

import { useToast } from "@/components/common/ToastProvider";
import { RoomForm } from "@/components/forms/RoomForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRoom } from "@/lib/services/rooms.service";
import type { CreateRoomInput } from "@/lib/types/room";

export default function NewRoomPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleCreateRoom = async (values: CreateRoomInput) => {
    await createRoom(values);
    showToast("Room created", "New room has been added to inventory.", "success");
    router.push("/admin/rooms");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Room</CardTitle>
        <CardDescription>Add a new room record with location and facilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <RoomForm onSubmit={handleCreateRoom} submitLabel="Create Room" />
      </CardContent>
    </Card>
  );
}
