import type { Task } from '@/types/models';
import { fmtDateTime } from './pdfCommon';

export type ManagerSignoffState = {
  mgrRecorded: boolean;
  mgrEscalated: boolean;
  mgrRejected: boolean;
  awaitingMgr: boolean;
};

export function getManagerSignoffState(task: Task): ManagerSignoffState {
  return {
    mgrRecorded: task.approvalStatus === 'APPROVED_MGR' || task.approvalStatus === 'VERIFIED',
    mgrEscalated: task.approvalStatus === 'ESCALATED',
    mgrRejected: task.approvalStatus === 'REJECTED_MGR',
    awaitingMgr: task.approvalStatus === 'SUBMITTED',
  };
}

/** Short status line for manager column (PDF + UI). */
export function getManagerSignoffFootnote(task: Task): string {
  const { mgrRecorded, mgrEscalated, mgrRejected, awaitingMgr } = getManagerSignoffState(task);
  const d = task.managerApprovedDate ? fmtDateTime(task.managerApprovedDate) : '';
  if (mgrRecorded) return `Manager approval recorded${d ? ` · ${d}` : ''}`;
  if (mgrEscalated) return `Escalated to executive review${d ? ` · ${d}` : ''}`;
  if (mgrRejected) return `Returned for revision${d ? ` · ${d}` : ''}`;
  if (awaitingMgr) return 'Awaiting branch manager decision.';
  return 'Not yet submitted for manager review.';
}

export function getExecutiveSignoffFootnote(task: Task): string {
  const ceoDone = task.approvalStatus === 'VERIFIED' && task.ceoVerifiedDate;
  const { mgrRecorded, mgrEscalated } = getManagerSignoffState(task);
  const eligible = mgrRecorded || mgrEscalated;
  if (ceoDone && task.ceoVerifiedDate) {
    return `Verified complete · ${fmtDateTime(task.ceoVerifiedDate)}`;
  }
  if (eligible) return 'Pending executive verification.';
  return 'Awaiting prior workflow steps.';
}
