'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DatabaseMode = 'online' | 'offline' | 'unknown';

interface DatabaseModeState {
  mode: DatabaseMode;
  lastChecked: Date | null;
  setMode: (mode: DatabaseMode) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DatabaseModeContext = createContext<DatabaseModeState>({
  mode: 'unknown',
  lastChecked: null,
  setMode: () => undefined,
});

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * DatabaseModeProvider
 *
 * Expose l'etat de connexion a la base de donnees (online/offline) a
 * l'ensemble de l'application. La valeur est mise a jour par l'intercepteur
 * Axios qui lit l'en-tete 'X-Database-Mode' sur chaque reponse reseau.
 *
 * Monter ce provider dans src/app/layout.tsx.
 */
export function DatabaseModeProvider({ children }: { children: React.ReactNode }) {
  const [mode,        setModeState]  = useState<DatabaseMode>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const prevModeRef                  = useRef<DatabaseMode>('unknown');

  const setMode = useCallback((newMode: DatabaseMode) => {
    setModeState(prev => {
      if (prev !== newMode) {
        prevModeRef.current = prev;
        setLastChecked(new Date());
      }
      return newMode;
    });
  }, []);

  // Ecouter l'evenement custom dispatche par l'intercepteur Axios
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ mode: DatabaseMode }>;
      setMode(custom.detail.mode);
    };

    window.addEventListener('cconnect:db-mode', handler);
    return () => window.removeEventListener('cconnect:db-mode', handler);
  }, [setMode]);

  return (
    <DatabaseModeContext.Provider value={{ mode, lastChecked, setMode }}>
      {children}
    </DatabaseModeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDatabaseMode(): DatabaseModeState {
  return useContext(DatabaseModeContext);
}

// ── Dispatcher — utilisé par l'intercepteur Axios ────────────────────────────

/**
 * Dispatchable uniquement cote client.
 * Appele depuis l'intercepteur Axios dans services/api.ts.
 */
export function dispatchDatabaseMode(mode: DatabaseMode): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('cconnect:db-mode', { detail: { mode } })
  );
}
