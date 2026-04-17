import { create } from 'zustand';
import { DEFAULT_USD_TO_BDT } from '@/constants/currency';

export type Currency = 'USD' | 'BDT';

interface ExchangeRate {
  usdToBdt: number;
  usdToAed?: number | null;
  bdtToAed?: number | null;
  effectiveDate: string;
}

interface CurrencyState {
  currency: Currency;
  exchangeRate: ExchangeRate;
  isLoading: boolean;

  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: ExchangeRate) => void;
  setLoading: (loading: boolean) => void;

  /** Convert amount from USD to the current display currency */
  convert: (amountUsd: number | null | undefined) => number | null;
  /** Get the currency symbol */
  symbol: () => string;
}

const DEFAULT_RATE: ExchangeRate = {
  usdToBdt: DEFAULT_USD_TO_BDT,
  usdToAed: 3.67,
  bdtToAed: null,
  effectiveDate: new Date().toISOString(),
};

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: 'BDT',
  exchangeRate: DEFAULT_RATE,
  isLoading: false,

  setCurrency: (currency) => set({ currency }),

  setExchangeRate: (rate) => set({ exchangeRate: rate }),

  setLoading: (isLoading) => set({ isLoading }),

  convert: (amountUsd) => {
    if (amountUsd == null) return null;
    const { currency, exchangeRate } = get();
    if (currency === 'USD') return amountUsd;
    return amountUsd * exchangeRate.usdToBdt;
  },

  symbol: () => {
    const { currency } = get();
    return currency === 'USD' ? '$' : '৳';
  },
}));
