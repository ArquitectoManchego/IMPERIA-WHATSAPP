'use client';
import { SessionProvider } from 'next-auth/react';
import { CrmUiProvider } from '@/context/CrmUiContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CrmUiProvider>{children}</CrmUiProvider>
    </SessionProvider>
  );
}

