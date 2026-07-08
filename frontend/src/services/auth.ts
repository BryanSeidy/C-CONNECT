import { ApiEnvelope, User } from '@/types';
import { apiClient, setMemoryToken } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  role?: 'buyer' | 'seller';
}

export interface AuthData {
  user: User;
  token?: string;
  access_token?: string;
}

export type AuthResponse    = ApiEnvelope<AuthData>;
export type ProfileResponse = ApiEnvelope<{ user: User }>;

export const authService = {
  /** POST /api/auth/login */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<unknown, AuthResponse>('/auth/login', credentials);
    if (res?.data?.token) setMemoryToken(res.data.token);
    return res;
  },

  /** POST /api/auth/register */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<unknown, AuthResponse>('/auth/register', {
      name: payload.fullName ?? '',
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password,
      role: payload.role ?? 'buyer',
    });
    if (res?.data?.token) setMemoryToken(res.data.token);
    return res;
  },

  /** GET /api/auth/me */
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<unknown, ProfileResponse>('/auth/me');
  },

  /** PUT /api/auth/me */
  updateProfile: async (data: { fullName?: string; companyName?: string; country?: string }): Promise<ProfileResponse> => {
    return apiClient.put<unknown, ProfileResponse>('/auth/me', data);
  },

  /** POST /api/auth/logout */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setMemoryToken(null);
    }
  },

  /** POST /api/auth/forgot-password */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient.post<unknown, { message: string }>('/auth/forgot-password', { email });
  },

  /** POST /api/auth/reset-password */
  resetPassword: async (payload: { email: string; token: string; password: string; passwordConfirmation: string }): Promise<{ message: string }> => {
    return apiClient.post<unknown, { message: string }>('/auth/reset-password', {
      email: payload.email,
      token: payload.token,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    });
  },

  /** POST /api/auth/email/verification-notification — auth required */
  resendVerificationEmail: async (): Promise<{ message: string }> => {
    return apiClient.post<unknown, { message: string }>('/auth/email/verification-notification');
  },
};
