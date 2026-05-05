"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/common/ToastProvider";
import { IssueReportForm } from "@/components/forms/IssueReportForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createIssue } from "@/lib/services/issues.service";
import { listRooms } from "@/lib/services/rooms.service";
import type { IssueInput } from "@/lib/types/issue";
import type { Room } from "@/lib/types/room";

export default function NewIssuePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get("roomId") ?? undefined;

  useEffect(() => {
    async function loadData() {
      const data = await listRooms();
      setRooms(data);
    }
    void loadData();
  }, []);

  const submit = async (input: IssueInput) => {
    await createIssue(input);
    showToast("Issue submitted", "Your report has been sent to admin.", "success");
    router.push("/customer/issues");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Portal</CardTitle>
        <CardDescription>Report a room issue with details and severity.</CardDescription>
      </CardHeader>
      <CardContent>
        {rooms.length ? (
          <IssueReportForm rooms={rooms} defaultRoomId={defaultRoomId} onSubmit={submit} />
        ) : (
          <p className="text-sm text-slate-500">Loading rooms...</p>
        )}
      </CardContent>
    </Card>
  );
}
