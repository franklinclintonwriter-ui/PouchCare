/**
 * Mock profile data for fields not yet in the API (company, address, extra contacts).
 * Replace with API calls when backend supports these fields.
 * @see docs/TASKS_PROFILE_SECURITY.md
 */

export interface MockCompanyInfo {
  companyName: string;
  vatId: string;
  website: string;
  industry: string;
}

export interface MockAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface MockExtraContacts {
  telegram: string;
  skype: string;
  preferredContact: "phone" | "whatsapp" | "telegram" | "email";
}

export const MOCK_COMPANY_INFO_DEFAULT: MockCompanyInfo = {
  companyName: "",
  vatId: "",
  website: "",
  industry: "",
};

export const MOCK_ADDRESS_DEFAULT: MockAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "BD",
};

export const MOCK_EXTRA_CONTACTS_DEFAULT: MockExtraContacts = {
  telegram: "",
  skype: "",
  preferredContact: "email",
};

export const INDUSTRIES = [
  "Agency / Marketing",
  "E-commerce",
  "SaaS / Software",
  "Media / Publishing",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Hospitality",
  "Non-profit",
  "Freelancer",
  "Other",
] as const;

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "BD", name: "Bangladesh" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "MY", name: "Malaysia" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "OTHER", name: "Other" },
];

const PROFILE_STORAGE_KEY = "pouchcare_mock_profile_v1";

interface StoredProfile {
  company: MockCompanyInfo;
  address: MockAddress;
  contacts: MockExtraContacts;
}

export function loadMockProfile(): StoredProfile {
  try {
    const raw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredProfile;
  } catch {
    /* ignore */
  }
  return {
    company: { ...MOCK_COMPANY_INFO_DEFAULT },
    address: { ...MOCK_ADDRESS_DEFAULT },
    contacts: { ...MOCK_EXTRA_CONTACTS_DEFAULT },
  };
}

export function saveMockProfile(patch: Partial<StoredProfile>): void {
  try {
    const current = loadMockProfile();
    sessionStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...current, ...patch }),
    );
  } catch {
    /* ignore */
  }
}
