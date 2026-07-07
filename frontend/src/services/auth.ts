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

function backendRoot(): string {
  return (apiClient.defaults.baseURL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');
}

export const authService = {
  /**
   * Récupère le cookie CSRF — doit appeler le ROOT du backend, pas /api.
   * Correspond à GET http://localhost:8000/sanctum/csrf-cookie
   */
  getCsrfCookie: async (): Promise<void> => {
    await apiClient.get('/sanctum/csrf-cookie', { baseURL: backendRoot() });
  },

  /** POST /api/auth/login */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await authService.getCsrfCookie();
    const res = await apiClient.post<unknown, AuthResponse>('/auth/login', credentials);
    if (res?.data?.token) setMemoryToken(res.data.token);
    return res;
  },

  /** POST /api/auth/register */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    await authService.getCsrfCookie();
    return apiClient.post<unknown, AuthResponse>('/auth/register', {
      name: payload.fullName ?? '',
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password,
      role: payload.role ?? 'buyer',
    });
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
    await apiClient.post('/auth/logout');
    setMemoryToken(null);
  },
};
