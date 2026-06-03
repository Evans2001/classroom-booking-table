import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-brand-primary/50 focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-primary/10 placeholder:text-slate-400 resize-y",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
