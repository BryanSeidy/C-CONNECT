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

// ---------------------------------------------------------------------------
// Memory token — authentification par Bearer token uniquement (pas de cookie
// de session). Conservé en mémoire JS + sessionStorage (jamais localStorage :
// on évite qu'un token vole persister indéfiniment sur la machine).
// ---------------------------------------------------------------------------

const TOKEN_STORAGE_KEY = 'cconnect_token';

let _memoryToken: string | null =
  typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_STORAGE_KEY) : null;

export function setMemoryToken(token: string | null): void {
  _memoryToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getMemoryToken(): string | null {
  return _memoryToken;
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30_000,
});

// ---------------------------------------------------------------------------
// Request interceptor — attache le Bearer token sur toute route protégée
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined' && _memoryToken && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${_memoryToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — unwrap data, redirection sur 401
// ---------------------------------------------------------------------------

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
    const config = error.config as InternalAxiosRequestConfig | undefined;

    if (status === 401 && typeof window !== 'undefined') {
      const isAuthPage = /^\/(login|register|forgot-password|reset-password)/.test(window.location.pathname);
      if (!isAuthPage && !isPublic(config?.url)) {
        setMemoryToken(null);
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
