import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { sessionService } from './session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const PUBLIC_ENDPOINTS = [/^\/products(?:\/[^/]+)?$/, /^\/categories(?:\/[^/]+)?$/];

function getRequestPath(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url, API_BASE_URL).pathname.replace(new URL(API_BASE_URL).pathname, '') || '/';
  } catch {
    return url.split('?')[0] ?? '';
  }
}

function isPublicEndpoint(url?: string): boolean {
  const path = getRequestPath(url);
  return PUBLIC_ENDPOINTS.some((pattern) => pattern.test(path));
}

function shouldRedirectToLogin(error: AxiosError): boolean {
  const isUnauthorized = error.response?.status === 401;
  const isBrowser = typeof window !== 'undefined';
  const isAuthRoute = isBrowser && ['/login', '/register'].includes(window.location.pathname);

  return Boolean(isUnauthorized && isBrowser && !isAuthRoute && !isPublicEndpoint(error.config?.url));
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined' && !isPublicEndpoint(config.url)) {
    const { token } = sessionService.read();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (shouldRedirectToLogin(error)) {
      sessionService.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
