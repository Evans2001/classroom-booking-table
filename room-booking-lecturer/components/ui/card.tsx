import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/5 hover:ring-brand-primary/20 hover:border-brand-primary/30 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {props.children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-bold tracking-tight text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm font-medium text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
