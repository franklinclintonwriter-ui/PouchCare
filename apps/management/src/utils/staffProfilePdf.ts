import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StaffDocument } from '@/api/documents';
import { DOCUMENT_CATEGORIES } from '@/api/documents';
import { ROLE_LABELS } from '@/utils/permissions';
import type { AttendanceRecord, StaffProfileDetail, Task } from '@/types/models';

const PRIMARY: [number, number, number] = [30, 58, 138];
const SLATE: [number, number, number] = [51, 65, 85];
const HEADER_H = 26;

function s(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' && v.trim() === '') return '—';
  return String(v);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s(iso);
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s(iso);
  }
}

function fmtRating(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toFixed(decimals);
}

function categoryLabel(cat: StaffDocument['category']): string {
  return DOCUMENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function rolePermissionsSummary(rp: Record<string, boolean> | null | undefined): string {
  if (!rp) return '—';
  const on = Object.entries(rp)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return on.length ? on.join(', ') : 'None enabled';
}

type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function getFinalY(doc: jsPDF, fallback: number): number {
  const d = doc as JsPdfWithTable;
  return d.lastAutoTable?.finalY ?? fallback;
}

function drawFooter(doc: jsPDF, margin: number, generatedAt: string) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${generatedAt} · Confidential · Page ${i} of ${total}`, margin, pageH - 6);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 9, pageW - margin, pageH - 9);
  }
}

function sectionTitle(doc: jsPDF, margin: number, y: number, text: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(text.toUpperCase(), margin, y);
  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  return y + 5;
}

function ensureSpace(doc: jsPDF, y: number, needMm: number, margin: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needMm > pageH - 14) {
    doc.addPage();
    return margin + 6;
  }
  return y;
}

export interface StaffProfilePdfInput {
  member: StaffProfileDetail;
  tasks: Task[];
  attendance: AttendanceRecord[];
  documents: StaffDocument[];
  formatCurrency: (n: number) => string;
}

/**
 * Builds a styled multi-section staff dossier PDF and triggers download in the browser.
 */
export function downloadStaffProfilePdf(input: StaffProfilePdfInput): void {
  const { member, tasks, attendance, documents, formatCurrency } = input;
  const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageW, HEADER_H, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PouchCare', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Staff profile dossier · Internal use only', margin, 18);

  y = HEADER_H + 8;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(member.name, margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const roleLabel = ROLE_LABELS[member.systemRole] ?? member.systemRole;
  doc.text(`${roleLabel} · ${member.memberId}`, margin, y);
  y += 10;

  const kvRows = (rows: [string, string][]) => rows.map(([a, b]) => [a, b]);

  const addKv = (title: string, rows: [string, string][]) => {
    const body = kvRows(rows);
    if (body.length === 0) return;
    y = ensureSpace(doc, y, 18 + body.length * 5, margin);
    y = sectionTitle(doc, margin, y, title);
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body,
      styles: { fontSize: 8, cellPadding: 2.2, textColor: SLATE },
      headStyles: {
        fillColor: PRIMARY,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 52, fontStyle: 'bold', textColor: [71, 85, 105] },
        1: { cellWidth: pageW - margin * 2 - 52 },
      },
      margin: { left: margin, right: margin },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1,
    });
    y = getFinalY(doc, y) + 10;
  };

  const displayStatus = member.status ?? (member.isActive ? 'Active' : 'Inactive');

  addKv('Identity & role', [
    ['Full name', member.name],
    ['Staff ID', member.memberId],
    ['Status', displayStatus],
    ['System role', roleLabel],
    ['Branch', s(member.branch)],
    ['Department', s(member.department)],
    ['Joined', fmtDate(member.joinDate)],
    ['Profile admin', member.profileAdmin ? 'Yes' : 'No'],
  ]);

  addKv('Contact', [
    ['Primary email', s(member.email)],
    ['Secondary email', s(member.email2)],
    ['Phone', s(member.phone)],
    ['WhatsApp', s(member.whatsapp)],
  ]);

  addKv('Employment & compensation', [
    ['Employment type', s(member.employmentType)],
    ['Salary', formatCurrency(member.salary)],
    ['Termination date', fmtDate(member.terminationDate)],
    ['Exit reason', s(member.exitReason)],
  ]);

  addKv('Skills & expertise', [
    ['Primary skill', s(member.primarySkill)],
    ['Skill level', s(member.skillLevel)],
    ['Years experience', member.yearsExperience != null ? String(member.yearsExperience) : '—'],
    ['Secondary skills', s(member.secondarySkills)],
    ['Tools & stack', s(member.toolsKnown)],
    ['Certifications', s(member.certifications)],
  ]);

  addKv('Links & location', [
    ['Portfolio', s(member.portfolioUrl)],
    ['LinkedIn', s(member.linkedinUrl)],
    ['GitHub', s(member.githubUrl)],
    ['Country', s(member.country)],
    ['Address', s(member.address)],
    ['NID / Passport', s(member.nidPassport)],
    ['Emergency contact', s(member.emergencyContact)],
  ]);

  addKv('Performance', [
    ['Tasks assigned', String(member.tasksAssigned ?? 0)],
    ['Tasks completed', String(member.tasksCompleted ?? 0)],
    ['Tasks rated', String(member.totalTasksRated ?? 0)],
    ['Average task rating', fmtRating(member.averageTaskRating)],
    ['CEO performance (1–10)', fmtRating(member.ceoPerformanceRating, 1)],
    ['CEO rating note', s(member.ceoRatingNote)],
    ['CEO last rated', fmtDate(member.ceoLastRatedDate)],
    ['Performance score', fmtRating(member.performanceScore)],
  ]);

  const securityRows: [string, string][] = [];
  if (member.twoFactorEnabled !== undefined) {
    securityRows.push([
      'Two-factor authentication',
      member.twoFactorEnabled ? 'On' : 'Off',
    ]);
  }
  if (member.profileAdmin) {
    securityRows.push(['Last sign-in', fmtDateTime(member.lastLoginAt)]);
    securityRows.push(['Last sign-in IP', s(member.lastLoginIp)]);
    securityRows.push(['Role permissions (enabled)', rolePermissionsSummary(member.rolePermissions ?? null)]);
  }
  if (securityRows.length > 0) {
    addKv('Security & access', securityRows);
  }

  if (tasks.length > 0) {
    y = ensureSpace(doc, y, 24, margin);
    y = sectionTitle(doc, margin, y, 'Recent tasks');
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Status', 'Priority', 'Due', 'Project']],
      body: tasks.map((t) => [
        t.title,
        s(t.status),
        s(t.priority),
        fmtDate(t.dueDate),
        s(t.projectName ?? '—'),
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 10;
  }

  if (attendance.length > 0) {
    y = ensureSpace(doc, y, 24, margin);
    y = sectionTitle(doc, margin, y, 'Recent attendance');
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Check-in', 'Check-out', 'Hours', 'Status']],
      body: attendance.map((a) => [
        fmtDate(a.date),
        s(a.checkIn),
        s(a.checkOut),
        typeof a.hours === 'number' ? `${a.hours}h` : '—',
        s(a.status),
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 10;
  }

  if (documents.length > 0) {
    y = ensureSpace(doc, y, 24, margin);
    y = sectionTitle(doc, margin, y, 'Document register');
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Category', 'Verified', 'Uploaded']],
      body: documents.map((d) => [
        d.title,
        categoryLabel(d.category),
        d.isVerified ? 'Yes' : 'No',
        fmtDateTime(d.createdAt),
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 10;
  }

  drawFooter(doc, margin, generatedAt);

  const safeId = member.memberId.replace(/[^\w-]+/g, '_');
  doc.save(`staff-profile-${safeId}.pdf`);
}
