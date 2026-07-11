'use client';

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { DatabaseModeProvider } from '@/context/DatabaseModeContext';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <DatabaseModeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ToastProvider>
        <OfflineBanner />
      </DatabaseModeProvider>
    </AuthProvider>
  );
};
