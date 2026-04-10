'use client';

import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Settings, 
  Package, 
  FileText, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: MessageSquare, label: 'Mensajes', href: '/dashboard', active: true },
  { icon: Users, label: 'Clientes', href: '/dashboard/clientes' },
  { icon: Package, label: 'Pedidos', href: '/dashboard/pedidos' },
  { icon: FileText, label: 'Facturación', href: '/dashboard/facturacion' },
  { icon: BarChart3, label: 'Métricas', href: '/dashboard/stats' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-24 flex flex-col items-center py-8 border-r border-white/5 glass h-screen shrink-0 relative z-20">
      <div className="mb-12 relative group">
        <div className="absolute -inset-2 bg-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
        <div className="relative w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-8">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || (item.active && pathname === '/dashboard');
          return (
            <Link 
              key={index} 
              href={item.href}
              className={cn(
                "group relative p-4 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "animate-pulse")} />
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/5">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button className="p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all group relative">
          <LogOut className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-3 py-1 bg-red-950 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-red-500/20">
            Cerrar Sesión
          </div>
        </button>
      </div>
    </aside>
  );
}
