import { apiClient } from './api';

export const authService = {
  login: async (credentials: any) => {
    return apiClient.post('/auth/login', credentials);
  },
  
  register: async (userData: any) => {
    return apiClient.post('/auth/register', userData);
  },

  getProfile: async () => {
    return apiClient.get('/users/me');
  },

  updateProfile: async (userData: any) => {
    return apiClient.put('/users/me', userData);
  }
};
