import { Profile, UserRole, KycStatus } from './database';

export type UserProfile = Profile;

export interface AuthState {
  session: {
    accessToken: string;
    expiresAt: number;
    userId: string;
  } | null;
  profile: Profile | null;
  isLoading: boolean;
  activeRole: UserRole | null;
  kycStatus: KycStatus;
}

export interface OtpRequestPayload {
  phone: string; // E.164
}

export interface OtpVerifyPayload {
  phone: string;
  token: string; // 6-digit OTP
}

export interface AuthSessionResponse {
  user: Profile;
  access_token: string;
  refresh_token: string;
}
