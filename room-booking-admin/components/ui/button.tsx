import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "default" | "outline" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand-maroon text-white hover:bg-[#7a3332] focus-visible:ring-brand-gold",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-200 focus-visible:ring-brand-gold",
  destructive: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-brand-gold",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-brand-gold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", asChild = false, ...props }, ref) => {
    const baseClass = cn(
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(baseClass, child.props.className),
      });
    }

    return <button ref={ref} type={type} className={baseClass} {...props} />;
  },
);

Button.displayName = "Button";
