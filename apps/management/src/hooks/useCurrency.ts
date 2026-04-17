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
      const r = query.data;
      setExchangeRate({
        usdToBdt: r.usdToBdt,
        usdToAed: r.usdToAed,
        bdtToAed: r.bdtToAed,
        effectiveDate: r.effectiveDate,
      });
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
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/** Main currency hook - initializes from user and provides formatting */
export function useCurrency() {
  const user = useAuthStore((s) => s.user);
  const userType = useAuthStore((s) => s.userType);
  const currency = useCurrencyStore((s) => s.currency);
  const exchangeRate = useCurrencyStore((s) => s.exchangeRate);
  const convert = useCurrencyStore((s) => s.convert);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  // Sync display currency from staff profile (login payload may omit preferredCurrency)
  useEffect(() => {
    if (userType !== 'staff' || !user) return;
    const pref = (user as StaffUser).preferredCurrency ?? 'BDT';
    setCurrency(pref);
  }, [user, userType, setCurrency]);

  // Fetch exchange rate
  useExchangeRate();

  /**
   * Format a stored amount. Use `storedIn: 'USD'` for USD-denominated values (CRM, finance).
   * Use `storedIn: 'BDT'` for salaries/payroll recorded in Taka.
   */
  const formatMoney = useCallback(
    (
      amount: number | null | undefined,
      options?: { storedIn?: 'USD' | 'BDT'; showSymbol?: boolean },
    ) => {
      if (amount == null) return '—';
      const storedIn = options?.storedIn ?? 'USD';
      const showSymbol = options?.showSymbol ?? true;
      const locale = currency === 'BDT' ? 'en-BD' : 'en-US';
      const curCode = currency;

      let value: number;
      if (storedIn === 'USD') {
        const c = convert(amount);
        if (c == null) return '—';
        value = c;
      } else {
        value = currency === 'BDT' ? amount : amount / exchangeRate.usdToBdt;
      }

      if (showSymbol) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: curCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: curCode === 'BDT' ? 0 : 2,
        }).format(value);
      }
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: curCode === 'BDT' ? 0 : 2,
      }).format(value);
    },
    [currency, convert, exchangeRate.usdToBdt],
  );

  /** Amounts stored in USD (default product convention for cross-border totals). */
  const formatCurrency = useCallback(
    (amountUsd: number | null | undefined, options?: { showSymbol?: boolean }) =>
      formatMoney(amountUsd, { storedIn: 'USD', ...options }),
    [formatMoney],
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

  const symbolChar = currency === 'USD' ? '$' : '৳';

  return {
    currency,
    exchangeRate,
    symbol: symbolChar,
    formatMoney,
    formatCurrency,
    formatBoth,
    convert,
  };
}

export default useCurrency;
