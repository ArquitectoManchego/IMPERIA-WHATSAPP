'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Activity,
  Zap,
  Star,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MetricsPage() {
  return (
    <div className="flex-1 flex flex-col p-8 gap-8 relative z-10 overflow-y-auto">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Métricas del Ecosistema</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Análisis de rendimiento, servicios más demandados y actividad de clientes.</p>
        </div>

        <Button variant="outline" className="h-12 border-white/5 bg-white/5 hover:bg-white/10 text-white rounded-2xl px-6 gap-2 font-bold tracking-wider uppercase text-[10px]">
           Generar Reporte Full
        </Button>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Crecimiento', value: '24%', icon: TrendingUp, color: 'emerald' },
          { label: 'Engagement', value: '88%', icon: Activity, color: 'blue' },
          { label: 'Tiempo Resp.', value: '12m', icon: Clock, color: 'purple' },
          { label: 'Conversión', value: '4.2%', icon: Zap, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[2rem] border border-white/5 group relative">
             <div className={cn("mb-4 w-10 h-10 rounded-xl flex items-center justify-center border", `bg-${stat.color}-500/10 border-${stat.color}-500/20 text-${stat.color}-500`)}>
                <stat.icon className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
             <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Top Services Chart (Mock) */}
         <div className="lg:col-span-2 glass p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-1">Rendimiento por Servicio</h3>
                  <p className="text-xs text-slate-500 font-medium">Distribución de volumen en los últimos 30 días.</p>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">Mensual</div>
               </div>
            </div>

            <div className="flex items-end justify-between gap-6 h-64 px-4">
               {[
                 { h: 'h-[80%]', label: 'Bordado', color: 'bg-emerald-500' },
                 { h: 'h-[60%]', label: 'Serigrafía', color: 'bg-blue-500' },
                 { h: 'h-[45%]', label: 'DTF', color: 'bg-indigo-500' },
                 { h: 'h-[70%]', label: 'Uniformes', color: 'bg-purple-500' },
                 { h: 'h-[30%]', label: 'Diseño', color: 'bg-slate-700' },
               ].map((bar, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <div className={cn("w-full rounded-2xl relative group", bar.color, bar.h)}>
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.h.replace('h-[', '').replace(']', '')}
                       </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{bar.label}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Top Clients List */}
         <div className="glass p-10 rounded-[2.5rem] border border-white/5 flex flex-col">
            <div className="flex items-center gap-3 mb-10">
               <Star className="w-5 h-5 text-orange-400" />
               <h3 className="text-xl font-black text-white tracking-tight">Clientes Estrella</h3>
            </div>
            <div className="space-y-6 flex-1">
               {[
                 { name: 'Juan Pérez', total: '$12,400', orders: 15 },
                 { name: 'María García', total: '$8,200', orders: 8 },
                 { name: 'Taller Central', total: '$5,900', orders: 22 },
               ].map((c, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 text-white font-black text-xs">{i+1}</div>
                       <div>
                          <p className="text-sm font-black text-white tracking-tight">{c.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.orders} pedidos</p>
                       </div>
                    </div>
                    <p className="text-sm font-black text-emerald-500">{c.total}</p>
                 </div>
               ))}
            </div>
            <Button variant="ghost" className="mt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white">Ver Ranking Completo</Button>
         </div>
      </div>
    </div>
  );
}
