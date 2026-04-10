'use client';

import React from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mockInvoices = [
  { id: 'FAC-7821', client: 'Juan Pérez', date: '09 Abr 2026', amount: '$1,200', status: 'Paid' },
  { id: 'FAC-7822', client: 'María García', date: '08 Abr 2026', amount: '$3,500', status: 'Pending' },
  { id: 'FAC-7823', client: 'Taller Central', date: '08 Abr 2026', amount: '$450', status: 'Paid' },
  { id: 'FAC-7824', client: 'Empresa X', date: '07 Abr 2026', amount: '$2,800', status: 'Overdue' },
];

export default function FacturacionPage() {
  return (
    <div className="flex-1 flex flex-col p-8 gap-8 relative z-10 overflow-y-auto">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Facturación</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Control de ingresos, facturas emitidas y estados de pago.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="h-12 border-white/5 bg-white/5 hover:bg-white/10 text-white rounded-2xl px-6 gap-2 font-bold tracking-wider uppercase text-[10px]">
             Exportar Reporte
          </Button>
          <Button className="h-12 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all rounded-2xl px-6 gap-2 font-black tracking-widest uppercase text-[10px]">
             Nueva Factura
          </Button>
        </div>
      </header>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ingresos Mensuales', value: '$45,200', change: '+12.5%', icon: ArrowUpRight, color: 'emerald' },
          { label: 'Pagos Pendientes', value: '$12,800', change: '-4.2%', icon: ArrowDownRight, color: 'orange' },
          { label: 'Facturas Vencidas', value: '4', change: 'Estable', icon: AlertCircle, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2.5rem] border border-white/5 group relative overflow-hidden">
             <div className={cn("absolute top-0 right-0 p-6 opacity-10", `text-${stat.color}-500`)}>
                <CreditCard className="w-12 h-12" />
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
             <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
                <div className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-1", stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500')}>
                  {stat.change}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Invoice List */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
         <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-black text-white tracking-tight">Facturas Recientes</h3>
            <div className="flex gap-4">
               <div className="relative w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input className="w-full h-10 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-xs text-white" placeholder="Buscar..." />
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     <th className="px-8 py-6">ID</th>
                     <th className="px-8 py-6">Cliente</th>
                     <th className="px-8 py-6">Fecha</th>
                     <th className="px-8 py-6">Monto</th>
                     <th className="px-8 py-6">Estado</th>
                     <th className="px-8 py-6 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {mockInvoices.map(inv => (
                     <tr key={inv.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all">
                        <td className="px-8 py-6 text-sm font-bold text-slate-400">{inv.id}</td>
                        <td className="px-8 py-6 text-sm font-black text-white">{inv.client}</td>
                        <td className="px-8 py-6 text-xs text-slate-500 font-medium">{inv.date}</td>
                        <td className="px-8 py-6 text-sm font-black text-white">{inv.amount}</td>
                        <td className="px-8 py-6">
                           <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                              inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                              inv.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                           )}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex justify-center gap-2">
                             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl">
                               <Download className="w-4 h-4 text-slate-500" />
                             </Button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
