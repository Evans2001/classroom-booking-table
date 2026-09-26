"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RequestDecisionFormProps {
  onSubmit: (decision: "APPROVED" | "REJECTED", note?: string) => Promise<void> | void;
}

export function RequestDecisionForm({ onSubmit }: RequestDecisionFormProps) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsNote = decision === "REJECTED";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (needsNote && !note.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(decision, note);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="decision">Decision</Label>
        <Select
          id="decision"
          value={decision}
          options={[
            { label: "Approve", value: "APPROVED" },
            { label: "Reject", value: "REJECTED" },
          ]}
          onChange={(event) => setDecision(event.target.value as "APPROVED" | "REJECTED")}
          disabled={submitting}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">Note {needsNote ? "(required)" : "(optional)"}</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          required={needsNote}
          disabled={submitting}
          maxLength={500}
          placeholder={
            needsNote ? "Reason for rejection..." : "Optional note for requester..."
          }
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Decision"}
      </Button>
    </form>
  );
}
