import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown, Minus } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import type { PaginationMeta } from '@/types/api';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  getRowId?: (row: T) => string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  compact?: boolean;
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription,
  onRowClick,
  selectable = false,
  selectedIds,
  onSelectionChange,
  getRowId,
  sortField,
  sortDirection,
  onSort,
  pagination,
  onPageChange,
  compact = false,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.size === data.length;
  const someSelected = (selectedIds?.size ?? 0) > 0 && !allSelected;

  function toggleAll() {
    if (!onSelectionChange || !getRowId) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(getRowId)));
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className="w-full">
      {/* Desktop / tablet table */}
      <div className="edge-fade hidden overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80 sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-700/60 dark:bg-gray-800/50">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPadding,
                    'text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                    col.sticky && 'sticky left-0 z-10 bg-gray-50/80 dark:bg-gray-800/50',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-gray-300 dark:text-gray-600">
                        {sortField === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-primary-600" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className="px-3 py-3">
                      <Skeleton className="h-3.5 w-3.5 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cellPadding}>
                      <Skeleton className="h-4 w-full max-w-[120px] rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-10 sm:py-16">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId?.(row);
                const isSelected = rowId ? selectedIds?.has(rowId) : false;

                return (
                  <tr
                    key={rowId ?? index}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors duration-100',
                      onRowClick && 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/30',
                      isSelected && 'bg-primary-50/50 dark:bg-primary-900/10',
                    )}
                  >
                    {selectable && rowId && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(rowId)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          cellPadding,
                          'text-gray-700 dark:text-gray-300',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.sticky && 'sticky left-0 z-10 bg-white dark:bg-gray-800/80',
                        )}
                      >
                        {col.render
                          ? col.render(row, index)
                          : (row as Record<string, unknown>)[col.key] as ReactNode ?? <Minus className="h-3.5 w-3.5 text-gray-300" />}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="block space-y-3 sm:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
              <div className="mb-2 flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              <div className="space-y-2">
                {columns.slice(0, 3).map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))
          : data.length === 0 ? (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          ) : (
            data.map((row, index) => {
              const rowId = getRowId?.(row) ?? index.toString();
              return (
                <button
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'w-full rounded-xl border border-gray-200/80 bg-white p-3 text-left shadow-soft transition-all duration-150 sm:p-4',
                    'dark:border-gray-700/60 dark:bg-gray-800/80',
                    onRowClick
                      ? 'hover:shadow-elevated hover:-translate-y-[1px] active:scale-[0.99]'
                      : 'cursor-default',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {columns[0]?.render
                          ? columns[0].render(row, index)
                          : (row as Record<string, unknown>)[columns[0]?.key] as ReactNode}
                      </p>
                      {columns[1] && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {columns[1].render
                            ? columns[1].render(row, index)
                            : (row as Record<string, unknown>)[columns[1].key] as ReactNode}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {columns[columns.length - 1]?.label}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-gray-300">
                    {columns.slice(2).map((col) => (
                      <div key={col.key} className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          {col.label}
                        </span>
                        <span className="text-right">
                          {col.render
                            ? col.render(row, index)
                            : (row as Record<string, unknown>)[col.key] as ReactNode ?? <Minus className="h-3.5 w-3.5 text-gray-300" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })
          )}
      </div>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export { DataTable };
