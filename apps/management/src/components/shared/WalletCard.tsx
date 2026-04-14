import { cn } from '@/utils/cn';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';

interface WalletCardProps {
  balance: number;
  pendingCommissions?: number;
  totalEarned?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  compact?: boolean;
  className?: string;
}

function WalletCard({ balance, pendingCommissions, totalEarned, onDeposit, onWithdraw, compact = false, className }: WalletCardProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white',
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6',
        className,
      )}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <Wallet className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', 'text-white/70')} />
          <span className={cn(compact ? 'text-xs' : 'text-sm', 'font-medium text-white/70')}>Balance</span>
        </div>
        <p className={cn(compact ? 'mt-1 text-2xl' : 'mt-2 text-3xl sm:text-4xl', 'font-bold tracking-tight')}>
          {formatCurrency(balance)}
        </p>

        {!compact && (pendingCommissions !== undefined || totalEarned !== undefined) && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {pendingCommissions !== undefined && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/50">Pending</span>
                <p className="text-sm font-semibold">{formatCurrency(pendingCommissions)}</p>
              </div>
            )}
            {totalEarned !== undefined && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/50">Earned</span>
                <p className="text-sm font-semibold">{formatCurrency(totalEarned)}</p>
              </div>
            )}
          </div>
        )}

        {(onDeposit || onWithdraw) && (
          <div className={cn('flex gap-2', compact ? 'mt-3' : 'mt-4')}>
            {onDeposit && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
                onClick={onDeposit}
                className="bg-white/15 text-white hover:bg-white/25 border-0"
              >
                Deposit
              </Button>
            )}
            {onWithdraw && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                onClick={onWithdraw}
                className="bg-white/15 text-white hover:bg-white/25 border-0"
              >
                Withdraw
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { WalletCard };
