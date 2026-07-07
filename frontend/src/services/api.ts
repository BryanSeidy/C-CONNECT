import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { dispatchDatabaseMode, type DatabaseMode } from '@/context/DatabaseModeContext';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

/**
 * Patterns de routes publiques (pas de token Bearer requis).
 * Alignés sur routes/api.php — préfixes exacts du backend.
 */
const PUBLIC_PATTERNS: RegExp[] = [
  /^\/catalogue\//,
  /^\/rfqs(?:\/[^/]+)?$/,
  /^\/auth\/register$/,
  /^\/auth\/login$/,
  /^\/auth\/forgot-password$/,
  /^\/auth\/reset-password$/,
  /^\/sanctum\/csrf-cookie$/,
  /^\/webhooks\//,
];

function getPath(url?: string): string {
  if (!url) return '';
  try {
    const base = new URL(API_BASE_URL);
    return new URL(url, API_BASE_URL).pathname.replace(base.pathname.replace(/\/$/, ''), '') || '/';
  } catch {
    return url.split('?')[0] ?? '';
  }
}

function isPublic(url?: string): boolean {
  const path = getPath(url);
  return PUBLIC_PATTERNS.some((p) => p.test(path));
}

function readXsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Memory token (session-only — jamais localStorage direct)
// ---------------------------------------------------------------------------

let _memoryToken: string | null = null;

export function setMemoryToken(token: string | null): void {
  _memoryToken = token;
}

export function getMemoryToken(): string | null {
  return _memoryToken;
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30_000,
});

// ---------------------------------------------------------------------------
// Request interceptor
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined' && _memoryToken && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${_memoryToken}`;
  }

  const xsrf = readXsrfCookie();
  const method = config.method?.toLowerCase() ?? '';
  if (xsrf && ['post', 'put', 'patch', 'delete'].includes(method)) {
    config.headers['X-XSRF-TOKEN'] = xsrf;
  }

  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — unwrap data, retry on 419
// ---------------------------------------------------------------------------

let _refreshing = false;
let _queue: Array<() => void> = [];

async function refreshCsrf(failedConfig: InternalAxiosRequestConfig): Promise<unknown> {
  const root = API_BASE_URL.replace(/\/api\/?$/, '');

  if (_refreshing) {
    return new Promise<unknown>((resolve) => {
      _queue.push(() => resolve(apiClient(failedConfig)));
    });
  }

  _refreshing = true;
  try {
    await apiClient.get('/sanctum/csrf-cookie', { baseURL: root });
    const xsrf = readXsrfCookie();
    if (xsrf) failedConfig.headers['X-XSRF-TOKEN'] = xsrf;
    _queue.forEach((cb) => cb());
    _queue = [];
    return apiClient(failedConfig);
  } finally {
    _refreshing = false;
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Propager le mode base de donnees depuis le header backend
    const dbMode = response.headers['x-database-mode'] as string | undefined;
    if (dbMode === 'online' || dbMode === 'offline') {
      dispatchDatabaseMode(dbMode as DatabaseMode);
    }
    return response.data;
  },

  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as InternalAxiosRequestConfig & { _csrfRetried?: boolean };

    if (status === 419 && config && !config._csrfRetried) {
      config._csrfRetried = true;
      return refreshCsrf(config);
    }

    if (status === 401 && typeof window !== 'undefined') {
      const isAuthPage = /^\/(login|register|forgot-password|reset-password)/.test(window.location.pathname);
      if (!isAuthPage && !isPublic(config?.url)) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    const dbMode = response.headers['x-database-mode'];

    if (dbMode === 'offline') {
      // Déclencher un événement global ou mettre à jour un store (Zustand/Redux)
      window.dispatchEvent(new CustomEvent('database-offline', { detail: true }));
    } else if (dbMode === 'online') {
      window.dispatchEvent(new CustomEvent('database-offline', { detail: false }));
    }

    return response;
  },
  (error) => {
    // En cas d'erreur réseau totale (Laravel lui-même est inaccessible)
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('database-offline', { detail: true }));
    }
    return Promise.reject(error);
  }
);
