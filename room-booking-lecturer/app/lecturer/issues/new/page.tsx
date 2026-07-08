"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertOctagon, ChevronLeft } from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/common/ToastProvider";
import { IssueReportForm } from "@/components/forms/IssueReportForm";
import { listRooms } from "@/lib/services/rooms.service";
import { createIssue } from "@/lib/services/issues.service";
import type { IssueInput } from "@/lib/types/issue";
import type { Room } from "@/lib/types/room";

export default function NewIssuePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get("roomId") ?? undefined;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await listRooms();
      setRooms(data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const submit = async (input: IssueInput) => {
    await createIssue(input);
    showToast("Issue submitted", "Your report has been sent to admin.", "success");
    router.push("/lecturer/issues");
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Action Bar */}
      <Link href="/lecturer/issues" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Issues
      </Link>

      {/* Hero Title */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-action-danger/10 text-action-danger">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Report Issue</h1>
          <p className="text-sm font-medium text-slate-500">Alert admin to classroom problems.</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        ) : rooms.length ? (
          <IssueReportForm rooms={rooms} defaultRoomId={defaultRoomId} onSubmit={submit} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-slate-500">No rooms available.</p>
          </div>
        )}
      </div>
    </div>
  );
}