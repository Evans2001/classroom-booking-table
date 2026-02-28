"use client";

import { Dialog } from "@/components/ui/dialog";
import { IssueForm } from "@/components/forms/IssueForm";
import type { IssueStatus } from "@/lib/types/issue";

interface IssueStatusModalProps {
  open: boolean;
  onClose: () => void;
  issueTitle: string;
  status: IssueStatus;
  onSubmit: (status: IssueStatus, note?: string) => Promise<void>;
}

export function IssueStatusModal({
  open,
  onClose,
  issueTitle,
  status,
  onSubmit,
}: IssueStatusModalProps) {
  const handleSubmit = async (nextStatus: IssueStatus, note?: string) => {
    await onSubmit(nextStatus, note);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Update Issue Status"
      description={`Update status for "${issueTitle}".`}
    >
      <IssueForm initialStatus={status} onSubmit={handleSubmit} />
    </Dialog>
  );
}
