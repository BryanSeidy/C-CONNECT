import { apiClient } from './api';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'buyer' | 'seller';
  }) => {
    return apiClient.post('/auth/register', userData);
  },

  // Fix #9: endpoint corrigé /users/me → /auth/profile
  getProfile: async () => {
    return apiClient.get('/auth/profile');
  },

  updateProfile: async (userData: {
    fullName?: string;
    companyName?: string;
    country?: string;
  }) => {
    return apiClient.put('/auth/profile', userData);
  }
};
