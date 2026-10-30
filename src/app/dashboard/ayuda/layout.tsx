import React from 'react';
import { getHelpTree } from '@/lib/help-store';
import HelpTreeNav from '@/components/help/HelpTreeNav';
import HelpSearch from '@/components/help/HelpSearch';
import { HelpCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getHelpTree();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#030712] text-white">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/5 flex items-center justify-between glass z-20 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ayuda"
            className="flex items-center gap-2.5 font-bold text-white hover:text-emerald-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight">Centro de Ayuda</span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
            Documentación Oficial
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <HelpSearch />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors hidden sm:inline-flex"
          >
            Volver a la App
          </Link>
        </div>
      </header>

      {/* Main Container: Sidebar Tree + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Navigation (Desktop) */}
        <aside className="w-72 lg:w-80 border-r border-white/5 p-4 overflow-y-auto custom-scrollbar shrink-0 hidden md:block bg-slate-950/40">
          <HelpTreeNav tree={tree} />
        </aside>

        {/* Center/Right Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto">
            {/* Mobile search */}
            <div className="block md:hidden mb-6">
              <HelpSearch />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
