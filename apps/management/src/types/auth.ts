import type { SystemRole } from './enums';

export interface StaffUser {
  id: string;
  memberId: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  branch?: string;
  phone?: string;
  whatsapp?: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
}

export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  referralCode: string;
  walletBalance: number;
  status: string;
  avatarUrl?: string;
}

export type AppUser = StaffUser | PortalUser;

export interface LoginRequest {
  email: string;
  password: string;
  totp?: string;
}

export interface LoginResponse {
  user: StaffUser;
  access_token: string;
  refresh_token: string;
  requireTotp?: boolean;
}

export interface PortalLoginResponse {
  user: PortalUser;
  access_token: string;
  refresh_token: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  country?: string;
  phone?: string;
  ref?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
