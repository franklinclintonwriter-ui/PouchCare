export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  referralCode: string;
  walletBalance: number;
  avatarUrl?: string;
  status?: string;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  skype?: string | null;
  preferredContact?: "phone" | "whatsapp" | "telegram" | "email" | null;
  country?: string | null;
  registrationDate?: string;
  companyName?: string | null;
  vatId?: string | null;
  companyWebsite?: string | null;
  industry?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  addressCountry?: string | null;
}

export interface PortalLoginResponse {
  user: PortalUser;
  access_token: string;
  refresh_token: string;
}

export interface PortalRegisterBody {
  fullName: string;
  email: string;
  password: string;
  country?: string;
  phone?: string;
  ref?: string;
}
