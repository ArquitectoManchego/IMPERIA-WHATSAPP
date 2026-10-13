import type { Metadata } from "next";

import "./globals.css";
import { FirebaseClientProvider } from "@/firebase";
import { AuthenticatedLayout } from "./authenticated-layout";
import { Toaster } from "@/components/ui/toaster";



export const metadata: Metadata = {
  title: "Imperia WA - CRM Automático",
  description: "Sistema avanzado de gestión de clientes por WhatsApp",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="min-h-full bg-black flex flex-col">
        <Providers>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

