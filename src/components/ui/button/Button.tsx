"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--arn-amber)] text-[var(--arn-white)] hover:bg-[var(--arn-amber-hover)] focus-visible:ring-[var(--arn-amber)]",
  outline:
    "border border-[var(--arn-bdr-2)] bg-[var(--arn-bg)] text-[var(--arn-txt)] hover:bg-[var(--arn-bg-2)] focus-visible:ring-[var(--arn-amber)]",
  ghost:
    "bg-transparent text-[var(--arn-amber)] hover:bg-[var(--arn-amber-bg)] focus-visible:ring-[var(--arn-amber)]",
  danger:
    "bg-[var(--arn-red)] text-[var(--arn-white)] hover:opacity-90 focus-visible:ring-[var(--arn-red)]",
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  isLoading = false,
  loadingLabel,
  fullWidth = true,
  className,
  disabled,
  type = "button",
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-160",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {isLoading ? <Spinner /> : startIcon ? <span className="flex items-center">{startIcon}</span> : null}
      {isLoading && loadingLabel ? loadingLabel : children}
      {!isLoading && endIcon ? (
        <span className="flex items-center">{endIcon}</span>
      ) : null}
    </button>
  );
};

export default Button;
