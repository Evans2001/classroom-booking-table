"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ApproveRejectModal } from "@/components/modals/ApproveRejectModal";
import { DataTable, type DataColumn } from "@/components/tables/DataTable";
import { requestsColumns } from "@/components/tables/columns/requests.columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/common/ToastProvider";
import { decideRequest, listRequests } from "@/lib/services/requests.service";
import type { BookingRequest, RequestStatus } from "@/lib/types/request";
import { REQUEST_STATUS_LABELS } from "@/lib/utils/constants";

export default function RequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RequestStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    async function loadData() {
      const data = await listRequests({ search, status });
      if (!active) return;
      setRequests(data);
      setLoading(false);
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [search, status]);

    const columns = useMemo<DataColumn<BookingRequest>[]>(
    () => [
      ...requestsColumns,
      {
        key: "actions",
        header: "Actions",
        render: (request) =>
          request.status === "PENDING" ? (
            <button 
              onClick={() => setSelected(request)}
              className="bg-white border border-[#5E2726] text-[#5E2726] hover:bg-[#5E2726] hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Review
            </button>
          ) : (
            <span className="text-slate-400 text-sm italic">Reviewed</span>
          ),
      },
    ],
    [],
  );

  const handleDecision = async (decision: "APPROVED" | "REJECTED", note?: string) => {
    if (!selected) return;
    try {
      await decideRequest(selected.id, decision, note);
      showToast("Request updated", `Request was ${decision.toLowerCase()}.`, "success");
      const data = await listRequests({ search, status });
      setRequests(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to review request";
      showToast("Review failed", message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:max-w-3xl">
        <Input
          placeholder="Search requester, department, purpose..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border-slate-200 shadow-sm py-2.5 px-4"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as RequestStatus | "ALL")}
          options={[
            { label: "All statuses", value: "ALL" },
            { label: REQUEST_STATUS_LABELS.PENDING, value: "PENDING" },
            { label: REQUEST_STATUS_LABELS.APPROVED, value: "APPROVED" },
            { label: REQUEST_STATUS_LABELS.REJECTED, value: "REJECTED" },
            { label: REQUEST_STATUS_LABELS.CANCELLED, value: "CANCELLED" },
          ]}
          className="border-slate-200 shadow-sm py-2.5 px-4"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading requests...</p>
      ) : requests.length ? (
        <DataTable columns={columns} data={requests} rowKey={(request) => request.id} />
      ) : (
        <EmptyState
          title="No requests"
          description="No booking requests match the current filters."
        />
      )}

      {selected ? (
        <ApproveRejectModal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          requesterName={selected.requesterName}
          onSubmit={handleDecision}
        />
      ) : null}
    </div>
  );
}
