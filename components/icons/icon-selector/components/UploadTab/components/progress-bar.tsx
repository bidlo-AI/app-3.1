export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1.5 w-full rounded bg-muted">
        <div className="h-1.5 rounded bg-primary transition-[width]" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
