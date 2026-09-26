"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none">
          <div className="border-b border-slate-200 px-5 py-4">
            <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className={description ? "mt-1 text-sm text-slate-500" : "sr-only"}>
              {description ?? `${title} dialog`}
            </DialogPrimitive.Description>
          </div>
          <div className="px-5 py-4">{children}</div>
          <div className="border-t border-slate-200 px-5 py-3">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                Close
              </button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
