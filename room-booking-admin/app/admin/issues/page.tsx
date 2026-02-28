"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { IssueStatusModal } from "@/components/modals/IssueStatusModal";
import { DataTable, type DataColumn } from "@/components/tables/DataTable";
import { issuesColumns } from "@/components/tables/columns/issues.columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/common/ToastProvider";
import { listIssues, updateIssueStatus } from "@/lib/services/issues.service";
import type { Issue, IssueSeverity, IssueStatus } from "@/lib/types/issue";
import { ISSUE_SEVERITY_LABELS, ISSUE_STATUS_LABELS } from "@/lib/utils/constants";

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IssueStatus | "ALL">("ALL");
  const [severity, setSeverity] = useState<IssueSeverity | "ALL">("ALL");
  const [selected, setSelected] = useState<Issue | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    async function loadData() {
      const data = await listIssues({ search, status, severity });
      if (!active) return;
      setIssues(data);
      setLoading(false);
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [search, severity, status]);

  const columns = useMemo<DataColumn<Issue>[]>(
    () => [
      ...issuesColumns,
      {
        key: "actions",
        header: "Actions",
        render: (issue) => (
          <Button size="sm" variant="outline" onClick={() => setSelected(issue)}>
            Update Status
          </Button>
        ),
      },
    ],
    [],
  );

  const handleUpdateIssue = async (nextStatus: IssueStatus, note?: string) => {
    if (!selected) return;
    await updateIssueStatus(selected.id, nextStatus, note);
    showToast("Issue updated", "Issue status has been updated.", "success");
    const data = await listIssues({ search, status, severity });
    setIssues(data);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-3">
        <Input
          placeholder="Search title, room, description..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as IssueStatus | "ALL")}
          options={[
            { label: "All statuses", value: "ALL" },
            { label: ISSUE_STATUS_LABELS.OPEN, value: "OPEN" },
            { label: ISSUE_STATUS_LABELS.IN_PROGRESS, value: "IN_PROGRESS" },
            { label: ISSUE_STATUS_LABELS.RESOLVED, value: "RESOLVED" },
            { label: ISSUE_STATUS_LABELS.CLOSED, value: "CLOSED" },
          ]}
        />
        <Select
          value={severity}
          onChange={(event) => setSeverity(event.target.value as IssueSeverity | "ALL")}
          options={[
            { label: "All severities", value: "ALL" },
            { label: ISSUE_SEVERITY_LABELS.LOW, value: "LOW" },
            { label: ISSUE_SEVERITY_LABELS.MEDIUM, value: "MEDIUM" },
            { label: ISSUE_SEVERITY_LABELS.HIGH, value: "HIGH" },
            { label: ISSUE_SEVERITY_LABELS.CRITICAL, value: "CRITICAL" },
          ]}
        />
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading issues...</p>
      ) : issues.length ? (
        <DataTable columns={columns} data={issues} rowKey={(issue) => issue.id} />
      ) : (
        <EmptyState title="No issues found" description="No issues match the selected filters." />
      )}
      {selected ? (
        <IssueStatusModal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          issueTitle={selected.title}
          status={selected.status}
          onSubmit={handleUpdateIssue}
        />
      ) : null}
    </div>
  );
}
