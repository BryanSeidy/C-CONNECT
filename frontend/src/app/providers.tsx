'use client';

import { AuthProvider } from '@/hooks/useAuth';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
