import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-800 border border-slate-200",
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  destructive: "bg-rose-100 text-rose-700 border border-rose-200",
  secondary: "bg-blue-100 text-blue-700 border border-blue-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
