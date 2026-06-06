import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors outline-none ring-offset-white placeholder:text-slate-400 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
