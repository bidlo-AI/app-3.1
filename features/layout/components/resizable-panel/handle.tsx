import { memo } from 'react';

interface ResizeHandleProps {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
}

/** Memoized resize handle to avoid re-renders when parent updates. */
export const ResizeHandle = memo(function ResizeHandle({ onPointerDown, onDoubleClick }: ResizeHandleProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="after:w-3 after:cursor-col-resize after:h-full bg-border/50 z-10 focus-visible:ring-ring duration-50 transition-colors hover:bg-primary relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 touch-none"
    />
  );
});
