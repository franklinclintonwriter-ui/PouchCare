import { cn } from "../../utils/cn";

export default function DataTable({ columns, rows, emptyMessage = "No records yet.", className }) {
  if (!rows?.length) {
    return (
      <div className={cn("rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50/70">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700 align-top">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
