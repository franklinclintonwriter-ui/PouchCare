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
  country?: string | null;
  registrationDate?: string;
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
