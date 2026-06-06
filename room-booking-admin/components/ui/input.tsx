import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-colors outline-none ring-offset-white placeholder:text-slate-400 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold/30 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
