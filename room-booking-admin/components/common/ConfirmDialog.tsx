"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
