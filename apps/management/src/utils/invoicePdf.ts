import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@/types/models";
import { INVOICE_OFFICIAL } from "@/constants/invoiceOfficialBranding";
import {
  SLATE,
  fmtDate,
  getFinalY,
  s,
  ensureSpace,
} from "./pdfCommon";
import pouchcareLogoUrl from "../../pouchcare-logo.png";

export type InvoicePdfInput = {
  invoice: Invoice;
  formatCurrency?: (n: number) => string;
};

async function loadPouchcareLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(pouchcareLogoUrl as unknown as string);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmtInvoiceUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function utcTimeNow(): string {
  const d = new Date();
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/**
 * Official PouchCare invoice PDF (PC-INV) — logo, masthead, ribbon, tables, footer mission.
 */
export async function downloadInvoicePdf(
  input: InvoicePdfInput,
): Promise<void> {
  const { invoice } = input;
  const logoDataUrl = await loadPouchcareLogoDataUrl();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const lines =
    invoice.items?.length > 0
      ? invoice.items
      : [
          {
            description: "Professional services",
            quantity: 1,
            rate: invoice.total,
            amount: invoice.total,
          },
        ];

  const paid = invoice.status === "PAID";
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const projectTitle =
    invoice.projectReference?.trim() ||
    invoice.service?.trim() ||
    "Professional services";
  const projectBody =
    invoice.notes?.trim() ||
    invoice.service?.trim() ||
    "Services as described in the line items below.";
  const paymentCopy =
    invoice.paymentMethod?.trim() || INVOICE_OFFICIAL.defaultPaymentMethods;

  const logoTop = y;
  const logoW = 36;
  const logoH = 12;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, logoTop, logoW, logoH);
    } catch {
      /* logo optional */
    }
  }

  const leftTextX = margin + logoW + 5;
  let textY = logoTop + 2;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const companyLines = doc.splitTextToSize(
    INVOICE_OFFICIAL.companyLine,
    pageW - leftTextX - 58,
  );
  doc.text(companyLines, leftTextX, textY);
  textY += companyLines.length * 4.2 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const addrLines = doc.splitTextToSize(
    INVOICE_OFFICIAL.addressLine,
    pageW - leftTextX - 58,
  );
  doc.text(addrLines, leftTextX, textY);
  textY += addrLines.length * 3.6 + 1;
  doc.text(
    `Web: ${INVOICE_OFFICIAL.web} · Email: ${INVOICE_OFFICIAL.email}`,
    leftTextX,
    textY,
  );
  textY += 3.8;
  doc.text(INVOICE_OFFICIAL.phone, leftTextX, textY);
  textY += 5;

  const rightX = pageW - margin;
  let ry = logoTop;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`No. ${invoice.number}`, rightX, ry, { align: "right" });
  ry += 4.2;
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice date  ${fmtDate(invoice.issueDate)}`, rightX, ry, {
    align: "right",
  });
  ry += 3.8;
  doc.text(`Due date  ${fmtDate(invoice.dueDate)}`, rightX, ry, {
    align: "right",
  });
  ry += 3.8;
  doc.text(`Time (UTC)  ${utcTimeNow()}`, rightX, ry, { align: "right" });
  ry += 4;

  const headerBottom = Math.max(textY, ry) + 3;
  y = headerBottom;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const ribbonText = INVOICE_OFFICIAL.ribbon;
  const ribbonW = doc.getTextWidth(ribbonText);
  const midX = pageW / 2;
  const gap = 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.line(margin, y - 0.3, midX - ribbonW / 2 - gap, y - 0.3);
  doc.line(midX + ribbonW / 2 + gap, y - 0.3, pageW - margin, y - 0.3);
  doc.text(ribbonText, midX, y, { align: "center" });
  y += 5;
  y += 1.2;
  doc.setFillColor(5, 150, 105);
  doc.rect(margin, y, 36, 1.35, "F");
  doc.setFillColor(30, 41, 59);
  doc.rect(margin + 36.8, y, pageW - 2 * margin - 36.8, 1.35, "F");
  y += 3.2;

  const heroY = y;
  if (paid) {
    doc.setDrawColor(167, 243, 208);
    doc.setFillColor(236, 253, 245);
  } else {
    doc.setDrawColor(253, 230, 138);
    doc.setFillColor(255, 251, 235);
  }
  const heroH = paid ? 24 : 28;
  doc.roundedRect(margin, heroY - 2, pageW - 2 * margin, heroH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(paid ? 6 : 120, paid ? 78 : 53, paid ? 59 : 15);
  doc.text(
    paid ? "Payment verified" : "Payment outstanding",
    margin + 3,
    heroY + 3.5,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(71, 85, 105);
  doc.text(
    paid
      ? "This invoice has been settled in full."
      : "Please remit the amount below by the due date.",
    margin + 3,
    heroY + 8,
  );
  const amtLine = `${paid ? "Amount received" : "Amount due"}  ${fmtInvoiceUsd(
    paid ? invoice.paidAmount : invoice.total,
  )} USD`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(amtLine, margin + 3, heroY + 14);
  if (!paid && balance > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Remaining: ${fmtInvoiceUsd(balance)} USD`,
      margin + 3,
      heroY + 20.5,
    );
  }
  y = heroY + heroH + 5;

  y = ensureSpace(doc, y, 28, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Billed to", margin, y);
  y += 4;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(s(invoice.clientName), margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(s(invoice.clientEmail), margin, y);
  y += 8;

  y = ensureSpace(doc, y, 32, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Project details", margin, y);
  y += 4;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(`Project: ${projectTitle}`, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(
    `Scope — ${projectBody}`,
    pageW - 2 * margin,
  );
  doc.text(descLines, margin, y);
  y += descLines.length * 4.2 + 4;

  const bodyRows = lines.map((row, i) => {
    const serviceName =
      invoice.service?.trim() ||
      row.description.split(/[.(\n]/)[0]?.trim() ||
      "Professional services";
    const deliver =
      i === 0 && invoice.notes?.trim()
        ? invoice.notes.trim().slice(0, 180)
        : "Per agreement";
    return [
      String(i + 1),
      serviceName.slice(0, 60),
      row.description.slice(0, 120),
      deliver.slice(0, 120),
      fmtInvoiceUsd(row.amount),
    ];
  });

  y = ensureSpace(doc, y, 30 + bodyRows.length * 8, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Line items", margin, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["#", "Service", "Description", "Deliverables", "Amount"]],
    body: bodyRows,
    theme: "striped",
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: SLATE,
      lineColor: [226, 232, 240],
      lineWidth: 0.12,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 48 },
      3: { cellWidth: 48 },
      4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });
  y = getFinalY(doc, y) + 6;

  const boxW = 72;
  const boxX = pageW - margin - boxW;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(boxX, y - 2, boxW, 16, 0.8, 0.8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Total (USD)", boxX + 4, y + 2.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtInvoiceUsd(invoice.total), boxX + boxW - 4, y + 11, {
    align: "right",
  });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("All figures in US dollars.", rightX, y, { align: "right" });
  y += 6;

  y = ensureSpace(doc, y, 36, margin);
  const pmLines = doc.splitTextToSize(paymentCopy, pageW - 2 * margin - 8);
  const pmBoxH = Math.min(40, pmLines.length * 3.6 + 14);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, 1.1, pmBoxH, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 1.1, y, pageW - 2 * margin - 1.1, pmBoxH, 1.2, 1.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payment & settlement", margin + 5, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(pmLines, margin + 5, y + 10);
  y += pmBoxH + 6;

  y = ensureSpace(doc, y, 40, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Summary", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Subtotal     ${fmtInvoiceUsd(invoice.subtotal)}`, margin, y);
  y += 4.5;
  doc.text(`Discount     ${fmtInvoiceUsd(0)}`, margin, y);
  y += 4.5;
  doc.text(`Tax     ${fmtInvoiceUsd(invoice.tax)}`, margin, y);
  y += 4.5;
  if (invoice.amountBdt != null && invoice.amountBdt > 0) {
    doc.text(
      `Reference (BDT)     ${invoice.amountBdt.toFixed(2)} BDT`,
      margin,
      y,
    );
    y += 4.5;
  }
  y += 4;

  y = ensureSpace(doc, y, 36, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Terms & conditions", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const termLines = doc.splitTextToSize(
    INVOICE_OFFICIAL.terms,
    pageW - 2 * margin,
  );
  doc.text(termLines, margin, y);
  y += termLines.length * 3.8 + 8;

  y = ensureSpace(doc, y, 36, margin);
  const footTop = y;
  const rightColX = pageW - margin;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", rightColX - 30, footTop, 30, 9);
    } catch {
      /* optional */
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for your business.", rightColX, footTop + 12, {
    align: "right",
  });

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(margin, footTop + 2, margin + 52, footTop + 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(INVOICE_OFFICIAL.companyShort, margin, footTop + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(INVOICE_OFFICIAL.signatoryTitle, margin, footTop + 12.5);

  y = Math.max(footTop + 22, footTop + 12) + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(INVOICE_OFFICIAL.mission, pageW / 2, y, { align: "center" });

  const generated = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated ${generated}`, pageW / 2, pageH - 8, { align: "center" });

  const safeName = invoice.number.replace(/[^a-zA-Z0-9-_]/g, "_");
  doc.save(`invoice-${safeName}.pdf`);
}
