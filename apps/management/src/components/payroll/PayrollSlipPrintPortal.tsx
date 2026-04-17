import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PayrollSalarySheet } from './PayrollSalarySheet';
import type { PayrollEntry } from '@/types/models';

/**
 * Renders the salary slip (off-screen) and triggers print with `html.payroll-slip-mode` (see index.css).
 */
export function usePayrollSlipPrint() {
  const [entry, setEntry] = useState<PayrollEntry | null>(null);

  const printSlip = (e: PayrollEntry) => {
    setEntry(e);
  };

  useEffect(() => {
    if (!entry) return;
    document.documentElement.classList.add('payroll-slip-mode');
    const raf = requestAnimationFrame(() => {
      window.print();
    });
    const onAfterPrint = () => {
      document.documentElement.classList.remove('payroll-slip-mode');
      setEntry(null);
    };
    window.addEventListener('afterprint', onAfterPrint, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [entry]);

  const portal =
    entry &&
    createPortal(
      <div id="payroll-slip-root" aria-hidden>
        <PayrollSalarySheet entry={entry} />
      </div>,
      document.body,
    );

  return { printSlip, portal };
}
