"use client";

import type { ButtonHTMLAttributes } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function ToolButton({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: ToolButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px";

  const styles =
    variant === "primary"
      ? "eco-btn-primary shadow-[0_3px_0_0_#166534] active:shadow-[0_1px_0_0_#166534] active:translate-y-[2px]"
      : "border border-moss-dark bg-moss-light/80 text-forest shadow-[0_3px_0_0_#86efac] hover:border-sage-dark hover:bg-moss-light active:shadow-[0_1px_0_0_#86efac] active:translate-y-[2px]";

  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
