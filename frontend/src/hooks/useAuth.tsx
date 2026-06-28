'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authService, ProfileResponse } from '@/services/auth';
import { sessionService } from '@/services/session';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

interface ApiValidationError {
  response?: {
    data?: {
      message?: string;
      errors?: string | Record<string, string[]>;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractServerError(error: unknown): string | null {
  const data = (error as ApiValidationError).response?.data;
  if (!data) return null;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.errors === 'string') return data.errors;
  if (data.errors) return Object.values(data.errors).flat().join(', ');
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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restoredSession = sessionService.read();
    setToken(restoredSession.token);
    setUser(restoredSession.user);
    setIsLoading(false);
  }, []);

  const setSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    sessionService.save(newToken, newUser);
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    sessionService.clear();
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const authToken = response.data.token ?? response.data.access_token;
      if (authToken && response.data.user) {
        setSession(authToken, response.data.user);
        return;
      }
      throw new Error('Réponse de connexion invalide');
    } catch (error: unknown) {
      const message = extractServerError(error);
      if (message) throw new Error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    try {
      await authService.register({ email, password, fullName, role: role as 'buyer' | 'seller' });
    } catch (error: unknown) {
      const message = extractServerError(error);
      if (message) throw new Error(message);
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      const nextUser = normalizeProfile(profile);
      if (!nextUser) return;

      setUser(nextUser);
      sessionService.saveUser(nextUser);
    } catch {
      // Keep current local session until the next authenticated request confirms invalidation.
    }
  };

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, refreshProfile, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};
