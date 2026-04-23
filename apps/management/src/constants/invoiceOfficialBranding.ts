/**
 * Official PouchCare invoice identity — matches company-issued PDFs (e.g. PC-INV-1001).
 * Update here when stationery / legal copy changes so PDF + print stay in sync.
 */
export const INVOICE_OFFICIAL = {
  companyLine: "Premium SEO & Digital Growth Solutions",
  addressLine:
    "Address: Phulpur, Mymensingh, postal code 2250, Bangladesh",
  web: "www.pouchcare.com",
  email: "hello@pouchcare.com",
  phone: "Phone: +44 20 7946 0958",
  /** Uppercase ribbon line */
  ribbon: "RESULTS DRIVEN",
  signatoryTitle: "Operations Manager",
  mission: "YOUR GROWTH, OUR MISSION",
  companyShort: "PouchCare",
  /** Default when invoice has no `paymentMethod` from API */
  defaultPaymentMethods: [
    "Binance TRC20 - BPAY",
    "USDT on TRC20 via Binance Pay (BPAY). Settlement when funds are received to the designated wallet.",
    "For wire, card, or other settlement options, contact hello@pouchcare.com.",
  ].join("\n"),
  terms: [
    "Payment is due within 7 days of the invoice date.",
    "Work commences after cleared payment unless otherwise agreed.",
    "All fees are non-refundable once services have started.",
    "We may suspend work if payment is delayed.",
  ].join("\n"),
} as const;
