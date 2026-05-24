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
        <p className="mb-2 text-sm font-bold text-forest-700">{label}</p>
      ) : null}
      <div className="h-3 w-full overflow-hidden rounded-full border border-cream-300 bg-cream-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest-600 to-forest-500 transition-all duration-300"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-xs text-ink/50">{clamped}%</p>
    </div>
  );
}
