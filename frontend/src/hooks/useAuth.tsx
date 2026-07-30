'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { User } from '@/types';
import { authService, ProfileResponse } from '@/services/auth';
import { sessionService } from '@/services/session';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  getMemoryToken,
  setMemoryToken,
} from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
      errors?: string | Record<string, string[]>;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractServerError(error: unknown): string | null {
  const data = (error as ApiErrorShape).response?.data;
  if (!data) return null;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.errors === 'string') return data.errors;
  if (data.errors && typeof data.errors === 'object') {
    // Renvoie la première erreur pour chaque champ
    const firstError = Object.values(data.errors)[0]?.[0];
    if (firstError) return firstError;
  }
  return null;
}

function normalizeProfile(response: ProfileResponse): User | null {
  const payload = response.data;
  if (!payload?.user) return null;
  const user = payload.user;
  return {
    ...user,
    fullName: user.fullName ?? user.name ?? null,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Compteur de génération : toute réponse /auth/me obsolète (résolue après
  // une requête plus récente, ex: refreshProfile() lancé par la page de
  // callback OAuth pendant que cette validation initiale est encore en vol)
  // est ignorée au lieu d'écraser un état plus frais.
  const profileRequestId = useRef(0);

  const applyToken = useCallback((token: string | null) => {
    setMemoryToken(token);
    setHasToken(!!token);
  }, []);

  const clearLocalAuth = useCallback(() => {
    setMemoryToken(null);
    setHasToken(false);
    setUser(null);
    sessionService.clear();
  }, []);

  // Sync si l'intercepteur Axios invalide la session (401 réel).
  useEffect(() => {
    const onExpired = () => {
      setHasToken(false);
      setUser(null);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // On mount: restore cached user only if a Bearer token exists. A user cache
  // without token is a dead session — treating it as authenticated causes the
  // /login ↔ /dashboard redirect loop (APIs leave without Authorization → 401).
  useEffect(() => {
    const restoredSession = sessionService.read();
    const token = getMemoryToken();

    if (!token) {
      if (restoredSession.user) {
        sessionService.clear();
      }
      setUser(null);
      setHasToken(false);
      setIsLoading(false);
      return;
    }

    setHasToken(true);
    if (restoredSession.user) {
      setUser(restoredSession.user);
    }

    const requestId = ++profileRequestId.current;

    authService.getProfile()
      .then((profile) => {
        if (requestId !== profileRequestId.current) return; // réponse obsolète
        const validatedUser = normalizeProfile(profile);
        if (validatedUser) {
          setUser(validatedUser);
          sessionService.saveUser(validatedUser);
        } else {
          clearLocalAuth();
        }
      })
      .catch((error: unknown) => {
        if (requestId !== profileRequestId.current) return; // réponse obsolète
        const status = (error as AxiosError)?.response?.status;
        // 401 : token invalide/expiré — purger toute la session locale
        if (status === 401) {
          clearLocalAuth();
          return;
        }
        // Erreur réseau / 5xx : garder le cache optimiste pour éviter un logout brutal
      })
      .finally(() => {
        if (requestId !== profileRequestId.current) return;
        setIsLoading(false);
      });
  }, [clearLocalAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const authUser = response.data.user;
      const token = response.data.token;

      if (!authUser) {
        throw new Error('Réponse de connexion invalide — données utilisateur manquantes.');
      }
      if (!token) {
        throw new Error('Réponse de connexion invalide — token manquant.');
      }

      // Token d'abord : tout fetch suivant (dashboard) doit voir le Bearer.
      applyToken(token);

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.saveUser(normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Connexion échouée. Vérifiez vos identifiants.');
    }
  }, [applyToken]);

  const register = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await authService.register({ email, password, fullName, role: role as 'buyer' | 'seller' });
      const authUser = response.data?.user;
      const token = response.data.token;

      if (!authUser) {
        throw new Error('Réponse d\'inscription invalide — données utilisateur manquantes.');
      }
      if (!token) {
        throw new Error('Réponse d\'inscription invalide — token manquant.');
      }

      applyToken(token);

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.saveUser(normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Inscription échouée. Veuillez réessayer.');
    }
  }, [applyToken]);

  const refreshProfile = useCallback(async () => {
    if (!getMemoryToken()) return;
    // Sync React dès qu'un token est présent (ex: callback OAuth qui
    // appelle setMemoryToken hors de ce hook avant refreshProfile).
    setHasToken(true);
    const requestId = ++profileRequestId.current;
    try {
      const profile = await authService.getProfile();
      if (requestId !== profileRequestId.current) return; // une requête plus récente a pris le dessus
      const nextUser = normalizeProfile(profile);
      if (!nextUser) return;
      setUser(nextUser);
      sessionService.saveUser(nextUser);
    } catch {
      // Keep current local session — server may be temporarily unreachable
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with client-side logout even if server call fails
    } finally {
      clearLocalAuth();
      router.push('/login');
    }
  }, [router, clearLocalAuth]);

  const value = useMemo(
    () => ({
      user,
      // Authentifié = profil + Bearer token. Le cache user seul ne suffit pas.
      isAuthenticated: user !== null && hasToken,
      isLoading,
      login,
      register,
      refreshProfile,
      logout,
    }),
    [user, hasToken, isLoading, login, register, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};
