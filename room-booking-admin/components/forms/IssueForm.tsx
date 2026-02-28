"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { IssueStatus } from "@/lib/types/issue";
import { ISSUE_STATUS_LABELS } from "@/lib/utils/constants";

interface IssueFormProps {
  initialStatus: IssueStatus;
  onSubmit: (status: IssueStatus, note?: string) => Promise<void> | void;
}

export function IssueForm({ initialStatus, onSubmit }: IssueFormProps) {
  const [status, setStatus] = useState<IssueStatus>(initialStatus);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(status, note);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={status}
          options={[
            { label: ISSUE_STATUS_LABELS.OPEN, value: "OPEN" },
            { label: ISSUE_STATUS_LABELS.IN_PROGRESS, value: "IN_PROGRESS" },
            { label: ISSUE_STATUS_LABELS.RESOLVED, value: "RESOLVED" },
            { label: ISSUE_STATUS_LABELS.CLOSED, value: "CLOSED" },
          ]}
          onChange={(event) => setStatus(event.target.value as IssueStatus)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="resolution-note">Resolution note (optional)</Label>
        <Textarea
          id="resolution-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note for this transition..."
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Updating..." : "Update Issue"}
      </Button>
    </form>
  );
}
