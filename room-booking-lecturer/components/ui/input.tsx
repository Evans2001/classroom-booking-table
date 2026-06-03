import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-brand-primary/50 focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-primary/10 placeholder:text-slate-400",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
