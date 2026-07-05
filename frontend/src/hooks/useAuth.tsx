'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authService, ProfileResponse } from '@/services/auth';
import { sessionService } from '@/services/session';
import { setMemoryToken } from '@/services/api';

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
    return Object.values(data.errors).flat().join(', ');
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

  // On mount: restore cached user for fast UI, then validate via /me
  useEffect(() => {
    const restoredSession = sessionService.read();

    // Optimistic restore from localStorage cache
    if (restoredSession.user) {
      setUser(restoredSession.user);
    }

    // Validate session with the server (cookie-based)
    authService.getProfile()
      .then((profile) => {
        const validatedUser = normalizeProfile(profile);
        if (validatedUser) {
          setUser(validatedUser);
          sessionService.saveUser(validatedUser);
        } else {
          // Server rejected the session
          setUser(null);
          sessionService.clear();
        }
      })
      .catch(() => {
        // Network error or 401 — clear stale local cache if no server session
        if (!restoredSession.user) {
          setUser(null);
        }
        // If we had a cached user but server fails, keep showing the user
        // to avoid a jarring logout on transient network errors
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const authToken = response.data.token ?? response.data.access_token;
      const authUser = response.data.user;

      if (!authUser) {
        throw new Error('Réponse de connexion invalide — données utilisateur manquantes.');
      }

      // Store token in memory for immediate use in this session
      if (authToken) {
        setMemoryToken(authToken);
      }

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.save(authToken ?? '', normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Connexion échouée. Vérifiez vos identifiants.');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await authService.register({ email, password, fullName, role: role as 'buyer' | 'seller' });
      const authUser = response.data.user;
      const authToken = response.data.token ?? response.data.access_token;

      if (!authUser) {
        throw new Error('Réponse d\'inscription invalide — données utilisateur manquantes.');
      }

      if (authToken) {
        setMemoryToken(authToken);
      }

      const normalizedUser: User = { ...authUser, fullName: authUser.fullName ?? authUser.name ?? null };
      setUser(normalizedUser);
      sessionService.save(authToken ?? '', normalizedUser);
    } catch (error: unknown) {
      const message = extractServerError(error);
      throw new Error(message ?? 'Inscription échouée. Veuillez réessayer.');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
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
      router.push('/auth/login');
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
