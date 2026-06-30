"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, AlertCircle, Image as ImageIcon, MapPin, Clock, MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { getIssueById } from "@/lib/services/issues.service";
import type { Issue } from "@/lib/types/issue";
import { formatDateTime } from "@/lib/utils/format";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getIssueById(params.id);
      setIssue(data ?? null);
      setLoading(false);
    }
    void loadData();
  }, [params.id]);

  if (loading) return (
    <div className="animate-pulse space-y-4 pt-4">
      <div className="h-48 rounded-3xl bg-slate-200" />
      <div className="h-64 rounded-3xl bg-slate-200" />
    </div>
  );

  if (!issue) {
    return (
      <EmptyState
        title="Issue not found"
        description="This issue ID is unavailable."
        action={
          <Button asChild size="sm">
            <Link href="/lecturer/issues">Back to Issues</Link>
          </Button>
        }
      />
    );
  }

  const isResolved = issue.status === "RESOLVED";

  return (
    <div className="space-y-6 pb-24">
      {/* Top Action Bar */}
      <Link href="/lecturer/issues" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Issues
      </Link>

      {/* Hero Issue Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ${isResolved ? "ring-1 ring-emerald-500/20" : "ring-1 ring-action-danger/20"}`}>
        <div className={`absolute inset-x-0 top-0 h-2 ${isResolved ? "bg-emerald-500" : "bg-action-danger"}`} />
        
        <div className="p-6 pt-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight mb-2">{issue.title}</h1>
              <div className="flex items-center gap-2">
                <StatusBadge status={issue.status} />
                <StatusBadge status={issue.severity} />
              </div>
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isResolved ? "bg-emerald-50 text-emerald-600" : "bg-action-danger/10 text-action-danger"}`}>
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-semibold text-slate-900">{issue.roomName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Reported {formatDateTime(issue.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-700 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              {issue.description}
            </p>
          </div>

          {issue.imageUrl && (
            <div className="pt-2">
              <a 
                href={issue.imageUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-slate-500" />
                View Attached Image
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Update Timeline</h3>
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[39px] top-8 bottom-8 w-px bg-slate-200" />
          
          <div className="space-y-6">
            {issue.updates.map((update, index) => (
              <div key={`${update.at}-${index}`} className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white border-[3px] border-brand-primary mt-1 shadow-sm" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={update.status} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatDateTime(update.at)}</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 border border-slate-100">
                    <MessageSquare className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                    <p className="font-medium leading-relaxed">{update.note}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Original Report Node */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-300 border-[3px] border-white mt-1 shadow-sm" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-500">Issue Reported</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{formatDateTime(issue.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
