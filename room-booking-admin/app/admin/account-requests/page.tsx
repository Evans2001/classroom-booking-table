"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/components/common/ToastProvider";
import { DataTable, type DataColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { decideAccountRequest, listAccountRequests } from "@/lib/services/account-requests.service";
import type { LecturerAccountRequest, LecturerAccountRequestStatus } from "@/lib/types/account-request";
import { formatDateTime } from "@/lib/utils/format";

const statusLabels: Record<LecturerAccountRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const statusVariants: Record<LecturerAccountRequestStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState<LecturerAccountRequest[]>([]);
  const [status, setStatus] = useState<LecturerAccountRequestStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const data = await listAccountRequests(status);
      if (!active) return;
      setRequests(data);
      setLoading(false);
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [status]);

  const reload = useCallback(async () => {
    setRequests(await listAccountRequests(status));
  }, [status]);

  const submitDecision = useCallback(async (request: LecturerAccountRequest, decision: "APPROVED" | "REJECTED") => {
    setBusyId(request.id);
    try {
      const updated = await decideAccountRequest(request.id, decision, notes[request.id]);
      showToast(
        decision === "APPROVED" ? "Account created" : "Request rejected",
        decision === "APPROVED"
          ? `Credentials were sent to ${updated.gmail}.`
          : "The lecturer request was rejected.",
        "success",
      );
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to review request";
      showToast("Review failed", message, "error");
    } finally {
      setBusyId(null);
    }
  }, [notes, reload, showToast]);

  const columns = useMemo<DataColumn<LecturerAccountRequest>[]>(
    () => [
      {
        key: "lecturer",
        header: "Lecturer",
        render: (request) => (
          <div>
            <p className="font-semibold text-slate-900">{request.name}</p>
            <p className="text-sm text-slate-500">{request.gmail}</p>
            <p className="text-xs text-slate-400">ID: {request.idNumber}</p>
          </div>
        ),
      },
      {
        key: "department",
        header: "Department",
        render: (request) => (
          <div>
            <p className="text-sm font-medium text-slate-800">{request.department}</p>
            <p className="text-xs text-slate-500">{request.position}</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (request) => (
          <div className="space-y-2">
            <Badge variant={statusVariants[request.status]}>{statusLabels[request.status]}</Badge>
            <p className="text-xs text-slate-500">{formatDateTime(request.submittedAt)}</p>
            {request.generatedUsername ? (
              <p className="text-xs font-medium text-slate-700">Username: {request.generatedUsername}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (request) =>
          request.status === "PENDING" ? (
            <div className="min-w-64 space-y-2">
              <Textarea
                value={notes[request.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [request.id]: event.target.value }))
                }
                placeholder="Optional approval note, required for rejection"
                className="min-h-20 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busyId === request.id}
                  onClick={() => submitDecision(request, "APPROVED")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === request.id}
                  onClick={() => submitDecision(request, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <p className="max-w-xs text-sm text-slate-500">{request.reviewerNote ?? "Reviewed"}</p>
          ),
      },
    ],
    [busyId, notes, submitDecision],
  );

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as LecturerAccountRequestStatus | "ALL")}
          options={[
            { label: "All statuses", value: "ALL" },
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading account requests...</p>
      ) : requests.length ? (
        <DataTable columns={columns} data={requests} rowKey={(request) => request.id} />
      ) : (
        <EmptyState title="No account requests" description="No lecturer account requests match this filter." />
      )}
    </div>
  );
}
