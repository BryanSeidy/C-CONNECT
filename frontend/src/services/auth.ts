import { ApiEnvelope, User } from '@/types';
import { apiClient } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  role?: 'buyer' | 'seller';
}

export interface AuthPayload {
  user: User;
  token?: string;
  access_token?: string;
}

export type AuthResponse = ApiEnvelope<AuthPayload>;
export type ProfileResponse = ApiEnvelope<{ user: User }>;

export const authService = {
  getCsrfCookie: async (): Promise<void> => {
    const baseURL = apiClient.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
    return apiClient.get('/sanctum/csrf-cookie', { baseURL });
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await authService.getCsrfCookie();
    return apiClient.post('/login', credentials);
  },

  register: async (userData: RegisterPayload): Promise<AuthResponse> => {
    await authService.getCsrfCookie();
    return apiClient.post('/register', {
      name: userData.fullName,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.password,
      role: userData.role,
    });
  },

  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get('/auth/profile');
  },

  updateProfile: async (userData: {
    fullName?: string;
    companyName?: string;
    country?: string;
  }): Promise<ProfileResponse> => {
    return apiClient.put('/auth/profile', userData);
  },

  logout: async (): Promise<void> => {
    return apiClient.post('/logout');
  },
};
