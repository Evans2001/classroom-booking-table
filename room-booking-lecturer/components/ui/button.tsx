import * as React from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "default" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  default: "bg-brand-primary text-white shadow-md hover:bg-brand-primary/90 focus-visible:ring-4 focus-visible:ring-brand-primary/20 focus-visible:outline-none hover:shadow-lg active:scale-[0.98]",
  outline: "border-2 border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 focus-visible:ring-4 focus-visible:ring-brand-primary/20 focus-visible:outline-none active:scale-[0.98]",
  destructive: "bg-action-danger text-white shadow-md hover:bg-action-danger/90 focus-visible:ring-4 focus-visible:ring-action-danger/20 focus-visible:outline-none hover:shadow-lg active:scale-[0.98]",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none active:scale-[0.98]",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-4 text-xs font-semibold tracking-wide rounded-lg",
  md: "h-11 px-6 text-sm font-semibold tracking-wide rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", asChild = false, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
      variantClass[variant],
      sizeClass[size],
      className,
    );

    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, { className: cn(classes, child.props.className) });
    }

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);

Button.displayName = "Button";
