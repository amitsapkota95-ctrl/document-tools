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
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95";

  const styles =
    variant === "primary"
      ? "bg-forest-700 text-cream-100 shadow-paper hover:bg-forest-600"
      : "border border-cream-300 bg-white text-forest-700 hover:border-cream-400 hover:bg-cream-200/40";

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
