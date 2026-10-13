'use client';

import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Package, 
  LogOut,
  Sparkles,
  Kanban,
  Megaphone,
  Bot,
  Eye,
  EyeOff,
  Globe,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useCrmUi, Locale } from '@/context/CrmUiContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { privacyMode, togglePrivacyMode, locale, setLocale, t, setIsNewChatModalOpen } = useCrmUi();

  const menuItems = [
    { icon: MessageSquare, label: t('messages'), href: '/dashboard' },
    { icon: Kanban, label: t('pipeline'), href: '/dashboard/crm' },
    { icon: Megaphone, label: t('campaigns'), href: '/dashboard/campanas' },
    { icon: Bot, label: t('automations'), href: '/dashboard/automatizaciones' },
    { icon: Package, label: t('orders'), href: '/dashboard/pedidos' },
  ];

  const cycleLocale = () => {
    const next: Record<Locale, Locale> = { es: 'en', en: 'pt', pt: 'es' };
    setLocale(next[locale]);
  };

  return (
    <aside className="w-20 flex flex-col items-center py-6 border-r border-white/5 glass h-screen shrink-0 relative z-30 select-none">
      {/* Brand logo */}
      <div className="mb-8 relative group cursor-pointer" onClick={() => setIsNewChatModalOpen(true)} title="Nuevo Chat Directo">
        <div className="absolute -inset-2 bg-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={index} 
              href={item.href}
              className={cn(
                "group relative p-3 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-emerald-400")} />
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Quick New Chat Button */}
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="group relative p-3 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          title={t('newChat')}
        >
          <UserPlus className="w-5 h-5" />
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-emerald-400 text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-emerald-500/20">
            {t('newChat')}
          </div>
        </button>
      </nav>

      {/* Utility Actions */}
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/5 w-full items-center">
        {/* Privacy Blur Toggle */}
        <button 
          onClick={togglePrivacyMode}
          className={cn(
            "group relative p-2.5 rounded-xl transition-all",
            privacyMode ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" : "text-slate-500 hover:text-white hover:bg-white/5"
          )}
          title={privacyMode ? t('privacyOn') : t('privacyOff')}
        >
          {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
            {privacyMode ? t('privacyOn') : t('privacyOff')}
          </div>
        </button>

        {/* Language switcher */}
        <button 
          onClick={cycleLocale}
          className="group relative p-2.5 rounded-xl text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-all text-xs font-bold uppercase"
          title={`Idioma actual: ${locale.toUpperCase()}`}
        >
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span className="text-[10px]">{locale.toUpperCase()}</span>
          </span>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
            {locale === 'es' ? 'Español' : locale === 'en' ? 'English' : 'Português'}
          </div>
        </button>

        {/* Logout */}
        <button 
          onClick={() => signOut()} 
          className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all group relative"
        >
          <LogOut className="w-5 h-5" />
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-rose-400 text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-rose-500/20">
            Cerrar Sesión
          </div>
        </button>
      </div>
    </aside>
  );
}
