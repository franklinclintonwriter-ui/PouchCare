import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface Props<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
}

export function DataTable<T>({ data, columns, loading, onRowClick, emptyState }: Props<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  return (
    <div className="overflow-x-auto rounded-xl border border-midnight-border">
      <table className="w-full border-collapse text-sm font-inter">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-[#0B1528]">
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted whitespace-nowrap">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            : table.getRowModel().rows.length === 0
              ? <tr><td colSpan={columns.length} className="py-16 text-center text-text-muted">{emptyState || 'No data found.'}</td></tr>
              : table.getRowModel().rows.map((row) => (
                <tr key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn('border-t border-midnight-border transition-colors duration-100', onRowClick && 'cursor-pointer hover:bg-midnight-hover')}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-text-secondary">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )
}
