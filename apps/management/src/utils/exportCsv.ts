/**
 * Export tabular data as a CSV file. Triggers a browser download.
 */
export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: {
    key: keyof T;
    label: string;
    format?: (value: unknown, row: T) => string;
  }[],
  filename: string,
) {
  if (rows.length === 0) return;

  const escapeCell = (value: unknown): string => {
    const str = value == null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = row[col.key];
          const formatted = col.format ? col.format(raw, row) : raw;
          return escapeCell(formatted);
        })
        .join(","),
    )
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
