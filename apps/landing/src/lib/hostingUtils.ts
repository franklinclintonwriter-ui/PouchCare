/** Shared hosting UI helpers — keep in sync with Badge variants. */

export function hostingStatusVariant(
  s: string,
): "green" | "yellow" | "red" | "slate" | "sky" {
  const u = s.toUpperCase();
  if (u === "ACTIVE") return "green";
  if (u === "PENDING") return "yellow";
  if (u === "EXPIRED" || u === "SUSPENDED") return "red";
  return "slate";
}
