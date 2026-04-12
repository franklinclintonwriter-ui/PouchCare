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
      <div className="edge-fade hidden max-h-[72vh] overflow-auto rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80 sm:block">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/95 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/90">
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
                    'sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm dark:bg-gray-800/90',
                    'text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                    col.sticky && 'left-0 z-30',
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
            <div key={i} className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-800/90">
              <Skeleton className="h-12 w-full max-w-xs rounded-lg" />
              <Skeleton className="mt-3 h-4 w-24 rounded" />
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                {columns.slice(0, 4).map((col) => (
                  <div key={col.key} className="flex justify-between gap-3">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
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
              const dataColumns = columns.filter((c) => c.key !== 'actions');
              const actionsCol = columns.find((c) => c.key === 'actions');
              const primaryCol = dataColumns[0];
              const secondaryCol = dataColumns[1];
              const restCols = dataColumns.slice(2);

              const cardClass = cn(
                'w-full rounded-2xl border border-gray-200/90 bg-white p-4 text-left shadow-sm transition-all duration-150',
                'dark:border-gray-700/60 dark:bg-gray-800/90',
                onRowClick
                  ? 'cursor-pointer hover:border-gray-300 hover:shadow-md active:scale-[0.99] dark:hover:border-gray-600'
                  : 'cursor-default',
              );

              const renderCell = (col: (typeof columns)[0]) =>
                col.render
                  ? col.render(row, index)
                  : ((row as Record<string, unknown>)[col.key] as ReactNode ?? (
                    <Minus className="h-3.5 w-3.5 text-gray-300" />
                  ));

              const mobileInner = (
                <>
                  {primaryCol ? (
                    <div className="min-w-0 [&_*]:max-w-full">{renderCell(primaryCol)}</div>
                  ) : null}
                  {secondaryCol ? (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 [&_*]:text-inherit">
                      {renderCell(secondaryCol)}
                    </div>
                  ) : null}
                  {restCols.length > 0 ? (
                    <dl className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                      {restCols.map((col) => (
                        <div
                          key={col.key}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <dt className="shrink-0 text-[13px] text-gray-500 dark:text-gray-400">
                            {col.label}
                          </dt>
                          <dd className="min-w-0 text-right text-[13px] font-medium text-gray-900 dark:text-gray-100">
                            {renderCell(col)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {actionsCol ? (
                    <div
                      className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700/60"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div
                        className={cn(
                          'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2',
                          '[&_button]:w-full sm:[&_button]:w-auto [&_button]:justify-center',
                        )}
                      >
                        {actionsCol.render
                          ? actionsCol.render(row, index)
                          : ((row as Record<string, unknown>)[actionsCol.key] as ReactNode)}
                      </div>
                    </div>
                  ) : null}
                </>
              );

              return (
                <div
                  key={rowId}
                  className={cardClass}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick && !actionsCol
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick && !actionsCol ? 0 : undefined}
                >
                  {mobileInner}
                </div>
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
