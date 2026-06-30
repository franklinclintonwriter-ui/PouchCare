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
  /** True when authenticator was set up but `/auth/2fa/verify` not completed yet. */
  twoFactorPending?: boolean;
  /** Effective RBAC flags from GET /staff/me (merged defaults + DB overrides). */
  permissions?: Record<string, boolean>;
  /** User's preferred display currency: 'USD' or 'BDT' */
  preferredCurrency?: 'USD' | 'BDT';
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
  remember?: boolean;
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
