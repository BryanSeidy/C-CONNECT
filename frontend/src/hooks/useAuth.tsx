'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authService, ProfileResponse } from '@/services/auth';
import { sessionService } from '@/services/session';
import { getMemoryToken, setMemoryToken } from '@/services/api';

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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Compteur de génération : toute réponse /auth/me obsolète (résolue après
  // une requête plus récente, ex: refreshProfile() lancé par la page de
  // callback OAuth pendant que cette validation initiale est encore en vol)
  // est ignorée au lieu d'écraser un état plus frais. C'était la cause
  // exacte de la boucle post-connexion Google : la validation initiale
  // (sans token, forcément 401) pouvait se résoudre APRÈS le refreshProfile()
  // authentifié du callback, et remettait `user` à null juste après qu'il
  // ait été correctement défini.
  const profileRequestId = useRef(0);

  // On mount: restore cached user for fast UI, then validate via /me —
  // mais seulement s'il existe déjà un token. Sans token, l'appel est
  // garanti de renvoyer 401 (ex: première visite, ou page de callback OAuth
  // qui n'a pas encore extrait son token de l'URL) ; le tenter quand même
  // ouvre la fenêtre de course ci-dessus pour rien.
  useEffect(() => {
    const restoredSession = sessionService.read();

    // Optimistic restore from localStorage cache
    if (restoredSession.user) {
      setUser(restoredSession.user);
    }

    if (!getMemoryToken()) {
      setIsLoading(false);
      return;
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
          setUser(null);
          sessionService.clear();
        }
      })
      .catch(() => {
        if (requestId !== profileRequestId.current) return; // réponse obsolète
        // Network error or 401 — clear stale local cache if no server session
        if (!restoredSession.user) {
          setUser(null);
        }
        // If we had a cached user but server fails, keep showing the user
        // to avoid a jarring logout on transient network errors
      })
      .finally(() => {
        if (requestId !== profileRequestId.current) return;
        setIsLoading(false);
      });
  }, []);  

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const authUser = response.data.user;
      const token = response.data.token;

      if (!authUser) {
        throw new Error('Réponse de connexion invalide — données utilisateur manquantes.');
      }

      setMemoryToken(token);

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.saveUser(normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Connexion échouée. Vérifiez vos identifiants.');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await authService.register({ email, password, fullName, role: role as 'buyer' | 'seller' });
      const authUser = response.data?.user;
      const token = response.data.token;

      if (!authUser) {
        throw new Error('Réponse d\'inscription invalide — données utilisateur manquantes.');
      }

      setMemoryToken(token);

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.saveUser(normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Inscription échouée. Veuillez réessayer.');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
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
      setMemoryToken(null);
      setUser(null);
      sessionService.clear();
      router.push('/login');
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      refreshProfile,
      logout,
    }),
    [user, isLoading, login, register, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};
