'use client';

import { useEffect, useState } from 'react';
import { OrderCard } from '@/components/CrmPanel';
import HelpContextButton from '@/components/help/HelpContextButton';
import { Package } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const c = new AbortController();
    fetch('/api/crm/orders', { signal: c.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setOrders(data);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => c.abort();
  }, []);

  return (
    <main className="h-full overflow-auto p-6 sm:p-8 text-slate-100 space-y-6">
      <header className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Pedidos Vinculados TAYLOR</h1>
            <p className="text-xs text-slate-400">Seguimiento de confección, fechas comprometidas y avisos de entrega</p>
          </div>
        </div>

        <HelpContextButton
          slug="pedidos/estados/pedidos-taylor"
          tooltip="Ayuda de Pedidos y Sincronización con TAYLOR"
        />
      </header>

      {error && <p role="alert" className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}

      {!orders.length && (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No hay pedidos cargados en este momento.</p>
          <p className="text-xs text-slate-500">Actualiza clientes y pedidos desde Mensajes para importar los registros existentes.</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        {orders.map((o) => (
          <section key={o.id} className="space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>{o.client}</span>
              <span className="text-xs text-slate-400 font-mono">{o.phone}</span>
            </h2>
            <OrderCard order={o} />
          </section>
        ))}
      </div>
    </main>
  );
}
