"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {label ? (
        <p className="mb-2 text-sm font-medium text-forest">{label}</p>
      ) : null}
      <div className="h-3 w-full overflow-hidden rounded-full border border-moss-dark bg-moss-light/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sage-dark to-accent-light transition-all duration-300"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-xs text-sand">{clamped}%</p>
    </div>
  );
}
