import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function usePagination(defaultLimit = 20) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newPage > 1) {
          next.set('page', String(newPage));
        } else {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('limit', String(newLimit));
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  return { page, limit, setPage, setLimit };
}
