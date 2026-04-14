/**
 * Registered legal entity — Certificate of Incorporation (Bangladesh, Act XVIII of 1994).
 * Keep in sync with official RJSC records.
 */
export const LEGAL_ENTITY_NAME = "Pouch Care International Ltd." as const;

export const LEGAL_ENTITY_TYPE = "limited company" as const;

/** Registrar of Joint Stock Companies & Firms (RJSC), Bangladesh */
export const INCORPORATION_JURISDICTION = "Bangladesh" as const;

export const INCORPORATION_ACT = "Companies Act, 1994 (Act XVIII of 1994)" as const;

export const CERTIFICATE_NUMBER = "C-202769/2025" as const;

/** Certificate date as shown on the incorporation certificate */
export const CERTIFICATE_DATE_DISPLAY = "18 June 2025" as const;

export const REGISTERED_OFFICE_CITY = "Dhaka" as const;

/** Public-facing brand — used alongside legal name where helpful */
export const TRADING_NAME = "PouchCare" as const;

/**
 * Plain hierarchy: the PouchCare brand sits under the registered company.
 * Example: "PouchCare operates under Pouch Care International Ltd."
 */
export const BRAND_OPERATES_UNDER_ENTITY =
  `${TRADING_NAME} operates under ${LEGAL_ENTITY_NAME}` as const;

export const LEGAL_UPDATED = "April 13, 2026" as const;
