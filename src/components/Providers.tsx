'use client';

import { SessionProvider } from "next-auth/react";
import { FirebaseClientProvider } from "@/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseClientProvider>
        {children}
      </FirebaseClientProvider>
    </SessionProvider>
  );
}
