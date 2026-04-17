import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';

interface CurrencyDisplayProps {
  /** Amount in USD (base currency) */
  amountUsd: number | null | undefined;
  /** Show both currencies with secondary in smaller text */
  showBoth?: boolean;
  /** Additional classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display a currency amount using the user's preferred currency.
 * Automatically converts USD to BDT if user preference is BDT.
 */
export function CurrencyDisplay({
  amountUsd,
  showBoth = false,
  className,
  size = 'md',
}: CurrencyDisplayProps) {
  const { formatCurrency, formatBoth } = useCurrency();

  if (amountUsd == null) {
    return <span className={cn('text-gray-400', className)}>—</span>;
  }

  if (showBoth) {
    const { usd, bdt, primary } = formatBoth(amountUsd);
    return (
      <span className={cn('inline-flex items-baseline gap-1.5', className)}>
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-sm',
          size === 'lg' && 'text-lg',
        )}>
          {primary}
        </span>
        <span className={cn(
          'text-gray-500 dark:text-gray-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-xs',
          size === 'lg' && 'text-sm',
        )}>
          ({primary === usd ? bdt : usd})
        </span>
      </span>
    );
  }

  return (
    <span className={cn(
      'font-medium',
      size === 'sm' && 'text-sm',
      size === 'lg' && 'text-lg',
      className,
    )}>
      {formatCurrency(amountUsd)}
    </span>
  );
}

/**
 * Currency symbol with icon styling
 */
export function CurrencyIcon({ className }: { className?: string }) {
  const { symbol } = useCurrency();
  return (
    <span className={cn('font-medium', className)}>
      {symbol}
    </span>
  );
}

export default CurrencyDisplay;
