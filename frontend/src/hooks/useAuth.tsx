'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export interface User {
  id: number;
  email: string;
  fullName?: string | null;
  companyName?: string | null;
  country?: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Helper: extract a human-readable error message from an axios error response.
 */
function extractServerError(err: any): string | null {
  const data = err?.response?.data;
  if (!data) return null;
  if (typeof data.message === 'string') return data.message;
  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors;
    return Object.values(data.errors).flat().join(', ');
  }
  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restaurer la session depuis localStorage au montage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    document.cookie = `auth-token=${newToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const login = async (email: string, password: string) => {
    try {
      const response: any = await authService.login({ email, password });
      const payload = response?.data ?? response;
      if (payload?.access_token && payload?.user) {
        setSession(payload.access_token, payload.user);
        return;
      }
      throw new Error('Reponse de connexion invalide');
    } catch (err: any) {
      const msg = extractServerError(err);
      if (msg) throw new Error(msg);
      throw err;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response: any = await authService.register({ email, password, fullName, role: role as 'buyer' | 'seller' });
      const payload = response?.data ?? response;
      if (payload?.access_token && payload?.user) {
        // Le user veut Inscription -> Connexion -> Dashboard (pas de session auto)
        // setSession(payload.access_token, payload.user);
        return;
      }
      throw new Error('Reponse d\'inscription invalide');
    } catch (err: any) {
      const msg = extractServerError(err);
      if (msg) throw new Error(msg);
      throw err;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile: any = await authService.getProfile();
      if (!profile?.data) return;

      const nextUser: User = {
        id: profile.data.id,
        email: profile.data.email,
        fullName: profile.data.fullName ?? null,
        companyName: profile.data.companyName ?? null,
        country: profile.data.country ?? null,
        role: profile.data.role
      };
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
    } catch {
      // noop: UI already has fallback local user data
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
  if (!context) throw new Error('useAuth doit etre utilise dans AuthProvider');
  return context;
};
