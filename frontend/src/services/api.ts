import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur requête : injecte le token JWT
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur réponse : normalise les données
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Token expiré → déconnexion automatique
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // On garde l'erreur axios originale pour que useAuth puisse lire error.response.data
    return Promise.reject(error);
  }
);
