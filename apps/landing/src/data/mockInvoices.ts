/**
 * Mock invoices for the client portal.
 * Replace with GET /portal/invoices when backend is ready.
 */

export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled" | "draft";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: InvoiceLineItem[];
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  paymentMethod: string | null;
  notes: string;
  relatedOrderId: string | null;
}

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-001",
    status: "paid",
    issueDate: "2026-03-01T00:00:00.000Z",
    dueDate: "2026-03-15T00:00:00.000Z",
    paidDate: "2026-03-10T00:00:00.000Z",
    currency: "USD",
    subtotal: 249,
    tax: 0,
    total: 249,
    lineItems: [
      { id: "li-1", description: "SEO On-Page Optimization (10 pages)", quantity: 1, unitPrice: 149, total: 149 },
      { id: "li-2", description: "DA50+ Guest Post Backlink", quantity: 2, unitPrice: 50, total: 100 },
    ],
    clientName: "John Doe",
    clientEmail: "john@clientbrand.io",
    clientAddress: "123 Business Rd, Dhaka 1205, Bangladesh",
    companyName: "PouchCare",
    companyAddress: "House 42, Road 7, Block D, Banani, Dhaka 1213, Bangladesh",
    companyEmail: "billing@pouchcare.com",
    companyPhone: "+880 1XXX-XXXXXX",
    paymentMethod: "Wallet",
    notes: "Thank you for your business!",
    relatedOrderId: null,
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-002",
    status: "paid",
    issueDate: "2026-03-15T00:00:00.000Z",
    dueDate: "2026-03-29T00:00:00.000Z",
    paidDate: "2026-03-20T00:00:00.000Z",
    currency: "USD",
    subtotal: 24.99,
    tax: 0,
    total: 24.99,
    lineItems: [
      { id: "li-3", description: "Business Pro Hosting — pouchcare.com (monthly)", quantity: 1, unitPrice: 24.99, total: 24.99 },
    ],
    clientName: "John Doe",
    clientEmail: "john@clientbrand.io",
    clientAddress: "123 Business Rd, Dhaka 1205, Bangladesh",
    companyName: "PouchCare",
    companyAddress: "House 42, Road 7, Block D, Banani, Dhaka 1213, Bangladesh",
    companyEmail: "billing@pouchcare.com",
    companyPhone: "+880 1XXX-XXXXXX",
    paymentMethod: "Wallet",
    notes: "",
    relatedOrderId: null,
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-003",
    status: "pending",
    issueDate: "2026-04-01T00:00:00.000Z",
    dueDate: "2026-04-15T00:00:00.000Z",
    paidDate: null,
    currency: "USD",
    subtotal: 580,
    tax: 0,
    total: 580,
    lineItems: [
      { id: "li-4", description: "Full Website SEO Audit", quantity: 1, unitPrice: 200, total: 200 },
      { id: "li-5", description: "Technical SEO Fix Pack", quantity: 1, unitPrice: 180, total: 180 },
      { id: "li-6", description: "Content Writing (5 articles × 1000 words)", quantity: 5, unitPrice: 40, total: 200 },
    ],
    clientName: "John Doe",
    clientEmail: "john@clientbrand.io",
    clientAddress: "123 Business Rd, Dhaka 1205, Bangladesh",
    companyName: "PouchCare",
    companyAddress: "House 42, Road 7, Block D, Banani, Dhaka 1213, Bangladesh",
    companyEmail: "billing@pouchcare.com",
    companyPhone: "+880 1XXX-XXXXXX",
    paymentMethod: null,
    notes: "Payment due within 14 days.",
    relatedOrderId: null,
  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2026-004",
    status: "overdue",
    issueDate: "2026-02-01T00:00:00.000Z",
    dueDate: "2026-02-15T00:00:00.000Z",
    paidDate: null,
    currency: "USD",
    subtotal: 89,
    tax: 0,
    total: 89,
    lineItems: [
      { id: "li-7", description: "Legacy VPS Hosting — legacy-app.org (monthly)", quantity: 1, unitPrice: 89, total: 89 },
    ],
    clientName: "John Doe",
    clientEmail: "john@clientbrand.io",
    clientAddress: "123 Business Rd, Dhaka 1205, Bangladesh",
    companyName: "PouchCare",
    companyAddress: "House 42, Road 7, Block D, Banani, Dhaka 1213, Bangladesh",
    companyEmail: "billing@pouchcare.com",
    companyPhone: "+880 1XXX-XXXXXX",
    paymentMethod: null,
    notes: "OVERDUE — please pay immediately to avoid service interruption.",
    relatedOrderId: null,
  },
  {
    id: "inv-005",
    invoiceNumber: "INV-2026-005",
    status: "draft",
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    paidDate: null,
    currency: "USD",
    subtotal: 9,
    tax: 0,
    total: 9,
    lineItems: [
      { id: "li-8", description: "Web → APK Starter Plan (monthly)", quantity: 1, unitPrice: 9, total: 9 },
    ],
    clientName: "John Doe",
    clientEmail: "john@clientbrand.io",
    clientAddress: "123 Business Rd, Dhaka 1205, Bangladesh",
    companyName: "PouchCare",
    companyAddress: "House 42, Road 7, Block D, Banani, Dhaka 1213, Bangladesh",
    companyEmail: "billing@pouchcare.com",
    companyPhone: "+880 1XXX-XXXXXX",
    paymentMethod: null,
    notes: "",
    relatedOrderId: null,
  },
];

export function getMockInvoiceById(id: string): MockInvoice | undefined {
  return MOCK_INVOICES.find((i) => i.id === id);
}

export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  "success" | "warning" | "error" | "neutral" | "info"
> = {
  paid: "success",
  pending: "warning",
  overdue: "error",
  cancelled: "neutral",
  draft: "info",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  cancelled: "Cancelled",
  draft: "Draft",
};
