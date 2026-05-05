import * as React from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "default" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  destructive: "bg-rose-600 text-white hover:bg-rose-500",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", asChild = false, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
