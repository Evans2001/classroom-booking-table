"use client";

import { Dialog } from "@/components/ui/dialog";
import { RequestDecisionForm } from "@/components/forms/RequestDecisionForm";

interface ApproveRejectModalProps {
  open: boolean;
  onClose: () => void;
  requesterName: string;
  onSubmit: (decision: "APPROVED" | "REJECTED", note?: string) => Promise<void>;
}

export function ApproveRejectModal({
  open,
  onClose,
  requesterName,
  onSubmit,
}: ApproveRejectModalProps) {
  const handleSubmit = async (decision: "APPROVED" | "REJECTED", note?: string) => {
    await onSubmit(decision, note);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Review Booking Request"
      description={`Make a decision for ${requesterName}.`}
    >
      <RequestDecisionForm onSubmit={handleSubmit} />
    </Dialog>
  );
}
