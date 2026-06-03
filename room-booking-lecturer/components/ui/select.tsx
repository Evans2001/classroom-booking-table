import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-brand-primary/50 focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-primary/10 cursor-pointer appearance-none",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);

Select.displayName = "Select";
