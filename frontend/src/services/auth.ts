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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (userData: RegisterPayload): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', {
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
};
