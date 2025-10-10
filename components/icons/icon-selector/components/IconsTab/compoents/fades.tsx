export const Fades = () => (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 w-[calc(100%-12px)] top-0 h-5 bg-gradient-to-b from-popover to-transparent z-10"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 w-[calc(100%-12px)] bottom-0 h-5 bg-gradient-to-t from-popover to-transparent z-10"
    />
  </>
);
