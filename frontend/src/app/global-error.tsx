'use client';

import { useEffect } from 'react';

// This boundary only fires if the root layout itself throws, so it must
// render its own <html>/<body> — it replaces the whole document.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[C-Connect] Root layout crash:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: '100vh',
            padding: 24,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: '#1A1A1A',
            background: '#F2EFE6',
          }}
        >
          <h2 style={{ margin: 0 }}>C-Connect est momentanément indisponible</h2>
          <p style={{ color: '#556B65', maxWidth: 420, margin: 0 }}>
            Une erreur critique a empêché le chargement de l&apos;application.
            Merci de réessayer dans un instant.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#13352E',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
