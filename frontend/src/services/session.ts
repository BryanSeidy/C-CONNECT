import { User } from '@/types';

const USER_KEY = 'cconnect_user_cache';

export interface StoredSession {
  token: string | null;
  user: User | null;
}

/**
 * Session service — manages the minimal client-side state.
 *
 * Architecture note: authentication is a Bearer token (Laravel Sanctum
 * personal access token), kept in memory + sessionStorage by services/api.ts
 * (see setMemoryToken/getMemoryToken). This service only caches the User
 * object in localStorage for immediate UI hydration on page load (avoids a
 * layout flash while /auth/me resolves) — it never stores the token itself.
 * A cached user without a Bearer token must NOT be treated as authenticated.
 */
export const sessionService = {
  /**
   * Read the cached user from localStorage.
   * Returns null token — the Bearer lives in memory + sessionStorage (api.ts).
   */
  read(): StoredSession {
    if (typeof window === 'undefined') return { token: null, user: null };

    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedUser) return { token: null, user: null };

    try {
      return { token: null, user: JSON.parse(savedUser) as User };
    } catch {
      this.clear();
      return { token: null, user: null };
    }
  },

  /**
   * Save the user profile to localStorage for UI continuity.
   * The token parameter is accepted for compatibility but not persisted.
   */
  save(_token: string, user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
    // Also clear legacy keys from previous implementation
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
