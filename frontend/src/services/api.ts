import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// Routes that never require an auth token
const PUBLIC_ENDPOINT_PATTERNS = [
  /^\/products(?:\/[^/]+)?$/,
  /^\/categories(?:\/[^/]+)?$/,
  /^\/auth\/login$/,
  /^\/auth\/register$/,
  /^\/login$/,
  /^\/register$/,
  /^\/webhooks\//,
];

function getRequestPath(url?: string): string {
  if (!url) return '';
  try {
    const base = new URL(API_BASE_URL);
    return new URL(url, API_BASE_URL).pathname.replace(base.pathname, '') || '/';
  } catch {
    return url.split('?')[0] ?? '';
  }
}

function isPublicEndpoint(url?: string): boolean {
  const path = getRequestPath(url);
  return PUBLIC_ENDPOINT_PATTERNS.some((pattern) => pattern.test(path));
}

function shouldRedirectToLogin(error: AxiosError): boolean {
  const isUnauthorized = error.response?.status === 401;
  const isBrowser      = typeof window !== 'undefined';
  const isAuthRoute    = isBrowser && ['/login', '/register'].includes(window.location.pathname);

  return Boolean(isUnauthorized && isBrowser && !isAuthRoute && !isPublicEndpoint(error.config?.url));
}

// ============================================================================
// Axios instance — cookie-first, credentials always included
// ============================================================================

export const apiClient = axios.create({
  baseURL:         API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30_000,
});

// Request interceptor: attach bearer token from memory if present
// The token is held in the closure below; set by the auth hook after login.
let _memoryToken: string | null = null;

export function setMemoryToken(token: string | null): void {
  _memoryToken = token;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined' && !isPublicEndpoint(config.url)) {
    if (_memoryToken) {
      config.headers.Authorization = `Bearer ${_memoryToken}`;
    }
  }
  return config;
});

// Response interceptor: handle auth failures globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (shouldRedirectToLogin(error)) {
      // Clear user cache and redirect; cookie invalidation happens server-side
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cconnect_user_cache');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
