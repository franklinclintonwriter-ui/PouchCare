import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Task } from '@/types/models';
import {
  PRIMARY,
  SLATE,
  drawFooter,
  drawHeaderBandWithLogo,
  ensureSpace,
  fmtDate,
  fmtDateTime,
  getFinalY,
  s,
  sectionTitle,
} from './pdfCommon';
import { getExecutiveSignoffFootnote, getManagerSignoffFootnote } from './taskApprovalCopy';
import pouchcareLogoUrl from '../../pouchcare-logo.png';

const APPROVAL_LABEL: Record<string, string> = {
  WAITING: 'Waiting for submission',
  SUBMITTED: 'Submitted for review',
  APPROVED_MGR: 'Approved by manager',
  REJECTED_MGR: 'Rejected by manager',
  ESCALATED: 'Escalated to CEO',
  VERIFIED: 'Verified / complete',
};

type TaskComment = { authorName: string; content: string; createdAt: string };

async function loadPouchcareLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(pouchcareLogoUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('read'));
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Formal sign-off block: branch manager + executive verification (matches TaskSignatureBlock). */
function drawAuthorizationSignOffPdf(
  doc: jsPDF,
  task: Task,
  margin: number,
  pageW: number,
  startY: number,
): number {
  let y = sectionTitle(doc, margin, startY, 'Authorization & sign-off');
  y += 6;

  const gap = 5;
  const colW = (pageW - 2 * margin - gap) / 2;

  const mgrStatus = getManagerSignoffFootnote(task);
  const ceoStatus = getExecutiveSignoffFootnote(task);
  const branchLine = task.assignedBranch ? `Branch: ${s(task.assignedBranch)}` : 'Branch: —';
  const mgrPrinted = s(task.assignedManagerName) !== '—' ? s(task.assignedManagerName) : '________________________';
  const ceoDone = task.approvalStatus === 'VERIFIED' && task.ceoVerifiedDate;
  const ceoPrinted = ceoDone ? 'Verified' : '—';

  const subL = doc.splitTextToSize(branchLine, colW - 6);
  const subR = doc.splitTextToSize('Quality sign-off (CEO)', colW - 6);
  const footL = doc.splitTextToSize(mgrStatus, colW - 6);
  const footR = doc.splitTextToSize(ceoStatus, colW - 6);
  const subH = Math.max(subL.length, subR.length) * 3.2;
  const footH = Math.max(footL.length, footR.length) * 3.35;
  const boxH = Math.max(52, 11 + subH + 2 + 9 + 14 + footH + 4);

  const drawCol = (
    x: number,
    title: string,
    subLines: string[],
    name: string,
    footLines: string[],
  ) => {
    doc.setFillColor(249, 251, 253);
    doc.setDrawColor(200, 210, 228);
    doc.setLineWidth(0.28);
    doc.roundedRect(x, y, colW, boxH, 2.5, 2.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(title, x + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 125);
    doc.text(subLines, x + 3, y + 11);
    const ly = y + 11 + subLines.length * 3.2;
    doc.setDrawColor(90, 95, 105);
    doc.setLineWidth(0.35);
    doc.line(x + 3, ly + 2, x + colW - 3, ly + 2);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.text(name, x + 3, ly + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(120, 125, 135);
    doc.text(footLines, x + 3, ly + 14);
  };

  drawCol(margin, 'BRANCH MANAGER', subL, mgrPrinted, footL);
  drawCol(margin + colW + gap, 'EXECUTIVE VERIFICATION', subR, ceoPrinted, footR);

  return y + boxH + 8;
}

export interface TaskPdfInput {
  task: Task;
  comments?: TaskComment[];
}

/**
 * One-page–friendly task work order / report PDF (A4), matching internal report styling.
 * Loads the PouchCare logo for the header (continues without logo if fetch fails).
 */
export async function downloadTaskPdf(input: TaskPdfInput): Promise<void> {
  await runTaskPdfDownload(input);
}

async function runTaskPdfDownload(input: TaskPdfInput): Promise<void> {
  const { task, comments = [] } = input;
  const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const logoDataUrl = await loadPouchcareLogoDataUrl();
  const subtitle = task.title.length > 90 ? `${task.title.slice(0, 87)}…` : task.title;
  const headerH = drawHeaderBandWithLogo(
    doc,
    pageW,
    'TASK REPORT',
    subtitle,
    `ID ${task.id.slice(0, 8)}…`,
    logoDataUrl,
  );

  y = headerH + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);

  const metaRows: [string, string][] = [
    ['Status', s(task.status)],
    ['Priority', s(task.priority)],
    ['Approval', APPROVAL_LABEL[task.approvalStatus] ?? s(task.approvalStatus)],
    ['Category', task.tags?.[0] ?? '—'],
    ['Project', task.projectName ?? '—'],
    ['Branch', s(task.assignedBranch)],
    ['Assignee', task.assigneeName || 'Unassigned'],
    ['Branch manager', s(task.assignedManagerName)],
    ['Due date', fmtDate(task.dueDate)],
    ['Created', fmtDate(task.createdAt)],
    ['Progress', typeof task.progress === 'number' ? `${task.progress}%` : '—'],
    ['Last progress update', fmtDateTime(task.progressUpdatedAt)],
    ['Actual hours', task.actualHours != null ? String(task.actualHours) : '—'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: metaRows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: SLATE },
    headStyles: {
      fillColor: PRIMARY,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: pageW - margin * 2 - 48 },
    },
    margin: { left: margin, right: margin },
  });

  y = getFinalY(doc, y + 40) + 8;

  y = ensureSpace(doc, y, 45, margin);
  y = sectionTitle(doc, margin, y, 'Description');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const desc = task.description?.trim() || 'No description provided.';
  const descLines = doc.splitTextToSize(desc, pageW - margin * 2);
  doc.text(descLines, margin, y);
  y += descLines.length * 4.5 + 6;

  const attachments = task.taskAttachments ?? [];
  if (attachments.length > 0) {
    y = ensureSpace(doc, y, 30 + attachments.length * 6, margin);
    y = sectionTitle(doc, margin, y, 'Attachments');
    autoTable(doc, {
      startY: y,
      head: [['Document', 'Added']],
      body: attachments.map((a) => [
        s(a.name),
        a.uploadedAt ? fmtDateTime(a.uploadedAt) : '—',
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 8;
  }

  if (comments.length > 0) {
    y = ensureSpace(doc, y, 40, margin);
    y = sectionTitle(doc, margin, y, 'Activity & comments');
    autoTable(doc, {
      startY: y,
      head: [['When', 'Author', 'Comment']],
      body: comments.map((c) => {
        const text =
          c.content.length > 1200 ? `${c.content.slice(0, 1197)}…` : c.content;
        return [fmtDateTime(c.createdAt), s(c.authorName), text];
      }),
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28 },
        2: { cellWidth: pageW - margin * 2 - 56 },
      },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 6;
  }

  y = ensureSpace(doc, y, 70, margin);
  y = drawAuthorizationSignOffPdf(doc, task, margin, pageW, y);

  drawFooter(doc, margin, generatedAt, 'PouchCare · Tasks');

  const safe = task.title.replace(/[^\w\s-]/g, '').slice(0, 40) || 'task';
  doc.save(`task-${safe}-${task.id.slice(0, 8)}.pdf`);
}
