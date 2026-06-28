import { User } from '@/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const COOKIE_NAME = 'auth-token';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600;

export interface StoredSession {
  token: string | null;
  user: User | null;
}

export const sessionService = {
  read(): StoredSession {
    if (typeof window === 'undefined') return { token: null, user: null };

    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (!token || !savedUser) return { token: null, user: null };

    try {
      return { token, user: JSON.parse(savedUser) as User };
    } catch {
      this.clear();
      return { token: null, user: null };
    }
  },

  save(token: string, user: User): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  },

  saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};
