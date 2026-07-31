import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { dispatchDatabaseMode, type DatabaseMode } from '@/context/DatabaseModeContext';
import { sessionService } from '@/services/session';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

/** Émis quand la session Bearer est invalidée (401 réel) — sync React AuthProvider. */
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

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
  /^\/livraison\/reponse\//,
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

function readAuthorizationHeader(config?: InternalAxiosRequestConfig): string | undefined {
  const raw = config?.headers?.Authorization ?? config?.headers?.authorization;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
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

/** Vide token + cache user et notifie AuthProvider (utilisé sur 401 réel). */
export function clearClientSession(): void {
  setMemoryToken(null);
  sessionService.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
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
    // Propager le mode base de données depuis le header backend
    const dbMode = response.headers['x-database-mode'] as string | undefined;
    if (dbMode === 'online' || dbMode === 'offline') {
      dispatchDatabaseMode(dbMode as DatabaseMode);
      window.dispatchEvent(new CustomEvent('database-offline', { detail: dbMode === 'offline' }));
    }
    return response.data;  // ← TOUJOURS retourner response.data
  },

  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as InternalAxiosRequestConfig | undefined;

    // Gestion 401 — ne détruire la session que si le 401 concerne la session
    // courante. Un fetch parti sans Bearer (cache user mort, course avant login)
    // qui revient après setMemoryToken ne doit PAS effacer le nouveau token.
    if (status === 401 && typeof window !== 'undefined') {
      const isAuthPage = /^\/(login|register|forgot-password|reset-password)/.test(window.location.pathname);
      if (!isAuthPage && !isPublic(config?.url)) {
        const reqAuth = readAuthorizationHeader(config);
        const currentBearer = _memoryToken ? `Bearer ${_memoryToken}` : null;

        // 401 d'une requête non authentifiée alors qu'un token existe déjà → obsolète
        if (!reqAuth && currentBearer) {
          return Promise.reject(error);
        }

        // 401 pour un ancien Bearer différent du token courant → obsolète
        if (reqAuth && currentBearer && reqAuth !== currentBearer) {
          return Promise.reject(error);
        }

        clearClientSession();
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    // Gestion erreur réseau
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('database-offline', { detail: true }));
    }

    return Promise.reject(error);
  },
);