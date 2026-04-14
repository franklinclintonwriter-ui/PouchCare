import { jsPDF } from 'jspdf';

export const PRIMARY: [number, number, number] = [30, 58, 138];
export const SLATE: [number, number, number] = [51, 65, 85];
export const HEADER_H_MM = 26;
/** Taller band when a right-aligned logo is embedded (task / branded PDFs). */
export const HEADER_H_MM_WITH_LOGO = 30;

export function s(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' && v.trim() === '') return '—';
  return String(v);
}

export function fmtDate(iso?: string | null): string {
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

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s(iso);
  }
}

export type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

export function getFinalY(doc: jsPDF, fallback: number): number {
  const d = doc as JsPdfWithTable;
  return d.lastAutoTable?.finalY ?? fallback;
}

export function drawFooter(doc: jsPDF, margin: number, generatedAt: string, subtitle = 'PouchCare') {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${subtitle} · Generated ${generatedAt} · Page ${i} of ${total}`,
      margin,
      pageH - 6,
    );
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 9, pageW - margin, pageH - 9);
  }
}

export function sectionTitle(doc: jsPDF, margin: number, y: number, text: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(text.toUpperCase(), margin, y);
  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  return y + 5;
}

export function ensureSpace(doc: jsPDF, y: number, needMm: number, margin: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needMm > pageH - 14) {
    doc.addPage();
    return margin + 8;
  }
  return y;
}

export function drawHeaderBand(
  doc: jsPDF,
  pageW: number,
  title: string,
  subtitle: string,
  badge?: string,
) {
  drawHeaderBandWithLogo(doc, pageW, title, subtitle, badge, null);
}

/**
 * Primary header strip with optional PouchCare logo (PNG data URL). Falls back to text-only if image fails.
 * Returns the header height in mm for positioning content below.
 */
export function drawHeaderBandWithLogo(
  doc: jsPDF,
  pageW: number,
  title: string,
  subtitle: string,
  badge: string | undefined,
  logoDataUrl: string | null,
): number {
  const h = logoDataUrl ? HEADER_H_MM_WITH_LOGO : HEADER_H_MM;
  const subMaxW = logoDataUrl ? pageW - 44 - 14 : pageW - 28;
  const badgeAlignRightAt = logoDataUrl ? pageW - 44 : pageW - 14;

  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageW, h, 'F');

  if (logoDataUrl) {
    try {
      const logoW = 26;
      const logoH = 10;
      doc.addImage(logoDataUrl, 'PNG', pageW - 14 - logoW, 7, logoW, logoH);
    } catch {
      /* keep text-only layout */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const sub = doc.splitTextToSize(subtitle, subMaxW);
  doc.text(sub, 14, 19);

  if (badge) {
    doc.setFontSize(7);
    doc.text(badge, badgeAlignRightAt, 12, { align: 'right' });
  }

  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  return h;
}
