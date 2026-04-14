import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function Pagination({ currentPage, totalPages, total, onPageChange, className }: PaginationProps) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing page <span className="font-medium text-gray-700 dark:text-gray-200">{currentPage}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">{totalPages}</span>
        {' '}({total} total)
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </PageButton>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">...</span>
          ) : (
            <PageButton
              key={page}
              onClick={() => onPageChange(page as number)}
              active={page === currentPage}
            >
              {page}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export { Pagination };
