import { User } from '@/types';

const USER_KEY = 'cconnect_user_cache';

export interface StoredSession {
  token: string | null;
  user: User | null;
}

/**
 * Session service — manages the minimal client-side state.
 *
 * Architecture note: The primary auth mechanism is the Sanctum httpOnly cookie
 * set by the backend. This service only caches the User object in localStorage
 * for immediate UI hydration (avoids layout flash on page load). The raw bearer
 * token is never stored in localStorage; it exists only in memory and in the
 * httpOnly cookie managed by the browser.
 */
export const sessionService = {
  /**
   * Read the cached user from localStorage.
   * Returns null token because the token lives in the httpOnly cookie.
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
