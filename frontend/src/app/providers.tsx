'use client';

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { DatabaseModeProvider } from '@/context/DatabaseModeContext';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <DatabaseModeProvider>
        {children}
        <OfflineBanner />
      </DatabaseModeProvider>
    </AuthProvider>
  );
};
