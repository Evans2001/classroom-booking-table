import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary" | "accent";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  destructive: "bg-red-100 text-red-700",
  secondary: "bg-blue-100 text-blue-700",
  accent: "bg-brand-gold text-slate-900 shadow-sm",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
