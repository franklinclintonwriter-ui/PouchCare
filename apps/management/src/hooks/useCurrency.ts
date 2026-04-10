import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrencyStore, type Currency } from '@/store/currencyStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import type { StaffUser } from '@/types/auth';

interface ExchangeRateResponse {
  usdToBdt: number;
  usdToAed?: number | null;
  bdtToAed?: number | null;
  effectiveDate: string;
}

/** Fetch latest exchange rate */
export function useExchangeRate() {
  const setExchangeRate = useCurrencyStore((s) => s.setExchangeRate);

  const query = useQuery<ExchangeRateResponse>({
    queryKey: ['exchange-rate-latest'],
    queryFn: async () => {
      const { data } = await api.get('/admin/exchange-rates/latest');
      return data as ExchangeRateResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.data) {
      setExchangeRate(query.data);
    }
  }, [query.data, setExchangeRate]);

  return query;
}

/** Hook to update user's currency preference */
export function useUpdateCurrencyPreference() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  return useMutation({
    mutationFn: async (currency: Currency) => {
      const { data } = await api.put('/staff/me', { preferredCurrency: currency });
      return data;
    },
    onSuccess: (_, currency) => {
      setCurrency(currency);
      updateUser({ preferredCurrency: currency } as Partial<StaffUser>);
      qc.invalidateQueries({ queryKey: ['staff-me'] });
    },
  });
}

/** Main currency hook - initializes from user and provides formatting */
export function useCurrency() {
  const user = useAuthStore((s) => s.user);
  const { currency, exchangeRate, convert, symbol, setCurrency } = useCurrencyStore();

  // Sync currency from user on mount/change
  useEffect(() => {
    if (user && 'preferredCurrency' in user && user.preferredCurrency) {
      setCurrency(user.preferredCurrency);
    }
  }, [user, setCurrency]);

  // Fetch exchange rate
  useExchangeRate();

  const formatCurrency = useCallback(
    (amountUsd: number | null | undefined, options?: { showSymbol?: boolean }) => {
      if (amountUsd == null) return '—';
      const converted = convert(amountUsd);
      if (converted == null) return '—';

      const { showSymbol = true } = options ?? {};
      const locale = currency === 'BDT' ? 'en-BD' : 'en-US';

      if (showSymbol) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: currency === 'BDT' ? 0 : 2,
        }).format(converted);
      }

      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'BDT' ? 0 : 2,
      }).format(converted);
    },
    [currency, convert],
  );

  const formatBoth = useCallback(
    (amountUsd: number | null | undefined): { usd: string; bdt: string; primary: string } => {
      if (amountUsd == null) {
        return { usd: '—', bdt: '—', primary: '—' };
      }
      const usdStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountUsd);

      const bdtAmount = amountUsd * exchangeRate.usdToBdt;
      const bdtStr = new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(bdtAmount);

      return { usd: usdStr, bdt: bdtStr, primary: currency === 'USD' ? usdStr : bdtStr };
    },
    [exchangeRate.usdToBdt, currency],
  );

  return {
    currency,
    exchangeRate,
    symbol: symbol(),
    formatCurrency,
    formatBoth,
    convert,
  };
}

export default useCurrency;
