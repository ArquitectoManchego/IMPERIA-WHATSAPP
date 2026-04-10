'use client';

import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  FileText,
  ChevronRight,
  User,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mockOrders = [
  { id: 'ORD-2024-001', client: 'Juan Pérez', service: 'Bordado', quantity: 50, status: 'Production', total: '$1,200', date: '09/04/2026' },
  { id: 'ORD-2024-002', client: 'María García', service: 'Serigrafía', quantity: 200, status: 'Quoting', total: '$3,500', date: '08/04/2026' },
  { id: 'ORD-2024-003', client: 'Taller Central', service: 'DTF', quantity: 15, status: 'Delivery', total: '$450', date: '08/04/2026' },
  { id: 'ORD-2024-004', client: 'Empresa X', service: 'Uniformes', quantity: 30, status: 'Facturado', total: '$2,800', date: '07/04/2026' },
];

const statusConfig: any = {
  Quoting: { label: 'Cotización', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', icon: FileText },
  Production: { label: 'Producción', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Clock },
  Delivery: { label: 'Entrega', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: Truck },
  Facturado: { label: 'Facturado', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle2 },
};

export default function PedidosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-1 flex flex-col p-8 gap-8 relative z-10 overflow-y-auto">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Pedidos</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Sigue el flujo de producción, bordados y facturación de tus clientes.</p>
        </div>

        <Button className="h-12 bg-white text-black hover:bg-blue-500 hover:text-white transition-all rounded-2xl px-6 gap-2 font-black tracking-widest uppercase text-[10px]">
           <Plus className="w-4 h-4" />
           Nueva Orden
        </Button>
      </header>

      {/* Kanban/List Filters */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {['Todos', 'Cotización', 'Producción', 'Entregas', 'Facturados'].map((tab, i) => (
          <button 
            key={tab} 
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              i === 0 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/5" 
                : "bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.Quoting;
          const StatusIcon = config.icon;

          return (
            <div key={order.id} className="glass p-8 rounded-[2.5rem] border border-white/5 group hover:border-blue-500/20 transition-all duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Package className="w-24 h-24" />
               </div>

               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{order.id}</span>
                    <div className={cn("px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2", config.bg, config.color, config.border)}>
                       <StatusIcon className="w-3 h-3" />
                       {config.label}
                    </div>
                 </div>

                 <div className="flex items-start justify-between mb-8">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight mb-1">{order.client}</h3>
                        <p className="text-xs text-slate-500 font-medium">{order.service} • {order.quantity} unidades</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black text-white tracking-tighter">{order.total}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.date}</p>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#09090b] flex items-center justify-center text-[8px] font-black text-white uppercase">U{i}</div>
                       ))}
                    </div>
                    <Button variant="ghost" className="h-10 px-4 rounded-xl text-blue-400 hover:bg-blue-400/10 text-[10px] font-black uppercase tracking-widest gap-2">
                       Ver Detalles
                       <ChevronRight className="w-4 h-4" />
                    </Button>
                 </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
