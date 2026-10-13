'use client';
import { signIn, useSession } from 'next-auth/react';
export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === 'loading') return <main className="p-12">Comprobando acceso…</main>;
  if (status !== 'authenticated') return <main className="m-auto p-12 max-w-lg space-y-5"><h1 className="text-3xl font-bold">IMPERIA · Clientes</h1><p>Inicia sesión con la cuenta autorizada. La cuenta principal también permite sincronizar Google Contacts.</p><button className="rounded-xl bg-emerald-600 px-6 py-3" onClick={() => signIn('google')}>Entrar con Google</button><p className="text-sm text-slate-400">Si el acceso es rechazado, verifica la lista de cuentas autorizadas en la configuración del servidor.</p></main>;
  return <>{children}</>;
}
