/** Client-side CSV download — safe for mock exports; escape quotes per RFC. */

function escapeCell(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [headers, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
