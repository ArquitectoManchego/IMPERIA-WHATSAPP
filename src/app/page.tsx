'use client';

import React from 'react';
import WhatsAppConnector from '@/components/WhatsAppConnector';

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black flex flex-col items-center justify-center p-6 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 mb-12 text-center">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-4">
          IMPERIA WA
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl font-medium tracking-wide">
          Motor de Automatización y CRM Exclusivo
        </p>
      </header>
      
      <main className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <WhatsAppConnector />
      </main>

      <footer className="relative z-10 mt-16 flex flex-col items-center gap-2">
        <div className="h-px w-12 bg-slate-800 mb-4" />
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
          ArquitectoManchego Ecosystem
        </p>
        <div className="flex gap-4 mt-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-75" />
          <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse delay-150" />
        </div>
      </footer>
    </div>
  );
}
