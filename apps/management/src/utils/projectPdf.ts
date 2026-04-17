import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, Task } from '@/types/models';
import {
  PRIMARY,
  SLATE,
  drawFooter,
  drawHeaderBand,
  ensureSpace,
  fmtDate,
  getFinalY,
  s,
  sectionTitle,
  HEADER_H_MM,
} from './pdfCommon';

export interface ProjectPdfInput {
  project: Project;
  tasks: Task[];
  formatCurrency: (n: number) => string;
}

/**
 * Project overview + related tasks table for client-ready export.
 */
export function downloadProjectPdf(input: ProjectPdfInput): void {
  const { project, tasks, formatCurrency } = input;
  const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const sub =
    project.clientName?.trim()
      ? `${project.name} · ${project.clientName}`
      : project.name;
  drawHeaderBand(doc, pageW, 'PROJECT SUMMARY', sub, project.status);

  y = HEADER_H_MM + 8;

  const metaRows: [string, string][] = [
    ['Client', s(project.clientName)],
    ['Status', s(project.status)],
    ['Progress', `${project.progress ?? 0}%`],
    ['Budget', formatCurrency(project.budget ?? 0)],
    ['Spent', formatCurrency(project.spent ?? 0)],
    ['Start', project.startDate ? fmtDate(project.startDate) : 'Not set'],
    ['Due', project.dueDate ? fmtDate(project.dueDate) : 'Not set'],
    ['Created', fmtDate(project.createdAt)],
    ['Team size', String(project.teamMembers?.length ?? 0)],
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
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: pageW - margin * 2 - 42 },
    },
    margin: { left: margin, right: margin },
  });

  y = getFinalY(doc, y + 50) + 8;

  y = ensureSpace(doc, y, 40, margin);
  y = sectionTitle(doc, margin, y, 'Scope & notes');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const notes = project.description?.trim() || 'No project notes.';
  const lines = doc.splitTextToSize(notes, pageW - margin * 2);
  doc.text(lines, margin, y);
  y += lines.length * 4.5 + 8;

  if (project.teamMembers?.length) {
    y = ensureSpace(doc, y, 24 + project.teamMembers.length * 5, margin);
    y = sectionTitle(doc, margin, y, 'Team');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Role']],
      body: project.teamMembers.map((m) => [s(m.name), '—']),
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = getFinalY(doc, y) + 8;
  }

  if (tasks.length > 0) {
    y = ensureSpace(doc, y, 30, margin);
    y = sectionTitle(doc, margin, y, 'Related tasks');
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Assignee', 'Status', 'Priority', 'Due']],
      body: tasks.map((t) => [
        s(t.title).slice(0, 80),
        s(t.assigneeName),
        s(t.status),
        s(t.priority),
        fmtDate(t.dueDate),
      ]),
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 32 },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 28 },
      },
      margin: { left: margin, right: margin },
    });
  }

  drawFooter(doc, margin, generatedAt, 'PouchCare · Projects');

  const safe = project.name.replace(/[^\w\s-]/g, '').slice(0, 36) || 'project';
  doc.save(`project-${safe}-${project.id.slice(0, 8)}.pdf`);
}
