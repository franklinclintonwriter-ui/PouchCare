import { PenLine, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Task } from '@/types/models';
import { getExecutiveSignoffFootnote, getManagerSignoffState } from '@/utils/taskApprovalCopy';
import pouchcareLogo from '../../../pouchcare-logo.png';

function fmt(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

type Props = {
  task: Task;
  className?: string;
};

/**
 * Formal sign-off area: branch manager + executive verification. Styled for screen and browser print.
 */
function TaskSignatureBlock({ task, className }: Props) {
  const branch = task.assignedBranch?.trim() || null;
  const mgrName = task.assignedManagerName?.trim() || null;

  const { mgrRecorded, mgrEscalated, mgrRejected, awaitingMgr } = getManagerSignoffState(task);
  const mgrDate = fmt(task.managerApprovedDate);

  const ceoDone = task.approvalStatus === 'VERIFIED' && !!task.ceoVerifiedDate;
  const ceoDate = fmt(task.ceoVerifiedDate);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary-200/90 bg-gradient-to-br from-white via-primary-50/40 to-sky-50/30 shadow-sm ring-1 ring-primary-100/80 print:border-gray-300 print:bg-white print:shadow-none print:ring-0',
        'print:break-inside-avoid',
        className,
      )}
      aria-label="Task authorization and sign-off"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-200/25 blur-2xl print:hidden" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-sky-200/20 blur-2xl print:hidden" />

      <div className="relative border-b border-primary-100/90 bg-white/60 px-5 py-4 backdrop-blur-sm print:border-gray-200 print:bg-transparent">
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={pouchcareLogo}
            alt="PouchCare"
            className="h-10 w-auto max-w-[140px] object-contain object-left print:h-9 print:max-w-[120px]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold tracking-tight text-gray-900">Authorization &amp; sign-off</h2>
            <p className="text-xs text-gray-500">
              Official record for task workflow — matches PDF export and printed reports.
            </p>
          </div>
          <div
            className="hidden shrink-0 rounded-xl border border-primary-200/80 bg-primary-50/90 p-2 text-primary-700 shadow-sm sm:flex print:hidden"
            aria-hidden
          >
            <PenLine className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 p-5 sm:grid-cols-2 sm:gap-0 sm:p-6">
        {/* Branch manager */}
        <div className="flex gap-4 sm:pr-6">
          <div
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-primary-600/85 bg-gradient-to-b from-primary-50 to-white text-[11px] font-bold uppercase leading-tight tracking-widest text-primary-800 shadow-inner print:border-gray-800 print:text-gray-900"
            aria-hidden
          >
            <span className="text-[10px] opacity-80">Pouch</span>
            <span className="text-sm">Care</span>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-700 print:text-gray-700">
                Branch manager
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {branch ? (
                  <>
                    Branch: <span className="font-medium text-gray-700">{branch}</span>
                  </>
                ) : (
                  'Branch not set on this task'
                )}
              </p>
            </div>

            <div className="relative pt-1">
              <svg
                className="mb-1 h-4 w-full text-primary-400/90 print:text-gray-400"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M2 8 C 40 2, 80 14, 120 6 S 180 2, 198 9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-400 to-transparent print:via-gray-500" />
              <p className="mt-2 font-serif text-lg italic text-gray-800 print:text-base">
                {mgrName || '_______________________'}
              </p>
              <p className="text-[11px] text-gray-500">Printed name — Branch manager</p>
            </div>

            <div
              className={cn(
                'inline-flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                mgrRecorded && 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 print:bg-gray-100 print:text-gray-900',
                mgrEscalated && 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80',
                mgrRejected && 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
                awaitingMgr && 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/70',
                !mgrRecorded && !mgrEscalated && !mgrRejected && !awaitingMgr && 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
              )}
            >
              {mgrRecorded && (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 print:bg-gray-700" />
                  Manager approval recorded
                  {mgrDate ? <span className="text-emerald-700/90 print:text-gray-700"> · {mgrDate}</span> : null}
                </>
              )}
              {mgrEscalated && (
                <>
                  Escalated to executive review
                  {mgrDate ? <span> · {mgrDate}</span> : null}
                </>
              )}
              {mgrRejected && (
                <>
                  Returned for revision
                  {mgrDate ? <span> · {mgrDate}</span> : null}
                </>
              )}
              {awaitingMgr && <>Awaiting branch manager decision</>}
              {!mgrRecorded && !mgrEscalated && !mgrRejected && !awaitingMgr && (
                <>Not yet submitted for manager review</>
              )}
            </div>
            {task.managerApprovalNote?.trim() && (mgrRecorded || mgrRejected) ? (
              <p className="rounded-md border border-gray-100 bg-white/80 p-2 text-[11px] leading-snug text-gray-600 print:border-gray-200">
                <span className="font-medium text-gray-700">Note: </span>
                {task.managerApprovalNote.trim()}
              </p>
            ) : null}
          </div>
        </div>

        {/* Executive (CEO) verification */}
        <div className="flex gap-4 border-t border-primary-100/90 pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 print:border-gray-200">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 shadow-inner print:border-gray-800',
              ceoDone
                ? 'border-violet-600/90 bg-gradient-to-b from-violet-50 to-white text-violet-800'
                : 'border-gray-200 bg-gray-50 text-gray-400 print:border-gray-300',
            )}
            aria-hidden
          >
            <ShieldCheck className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-800 print:text-gray-700">
                Executive verification
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Quality sign-off (CEO)</p>
            </div>

            <div className="relative pt-1">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent print:via-gray-400" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {ceoDone ? 'Verified complete' : 'Pending verification'}
              </p>
              {ceoDone && ceoDate ? (
                <p className="mt-1 text-[11px] text-gray-600">Recorded {ceoDate}</p>
              ) : (
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  {getExecutiveSignoffFootnote(task)}
                </p>
              )}
            </div>

            {task.completedDate && ceoDone ? (
              <p className="text-[11px] text-gray-500">
                Completion date:{' '}
                <span className="font-medium text-gray-700">{fmt(task.completedDate)}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export { TaskSignatureBlock };
