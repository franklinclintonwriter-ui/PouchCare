import type { ReactNode } from "react";

/**
 * Mobile-first: render `narrow` below `md`, `wide` from `md` up.
 * Use for tables (wide) + stacked cards (narrow). See `pages/dashboard/DASHBOARD_PORTAL.md`.
 */
export function NarrowWide({
  narrow,
  wide,
}: {
  narrow: ReactNode;
  wide: ReactNode;
}) {
  return (
    <>
      <div className="md:hidden">{narrow}</div>
      <div className="hidden md:block">{wide}</div>
    </>
  );
}
