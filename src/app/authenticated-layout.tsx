'use client';
import { signIn, useSession } from 'next-auth/react';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === 'loading') return <main className="p-12 text-slate-400">Comprobando acceso…</main>;
  if (status !== 'authenticated') {
    return (
      <main className="m-auto p-8 sm:p-12 max-w-lg space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">IMPERIA · CRM</h1>
          <p className="text-sm text-slate-400">
            Inicia sesión con tu cuenta autorizada (<span className="text-emerald-400 font-semibold">elchegos@gmail.com</span>).
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            onClick={() => signIn('google')}
          >
            Entrar con Google
          </button>

          <button
            className="w-full rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3 px-6 text-sm transition-all active:scale-[0.98]"
            onClick={() => signIn('credentials', { email: 'elchegos@gmail.com', callbackUrl: '/dashboard' })}
          >
            Acceso Rápido Directo
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Usa Acceso Rápido para entrar de inmediato mientras se validan las URIs en Google Cloud.
        </p>
      </main>
    );
  }
  return <>{children}</>;
}

