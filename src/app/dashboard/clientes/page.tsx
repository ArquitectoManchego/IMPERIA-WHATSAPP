'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CrmPanel from '@/components/CrmPanel';
import { Kanban, Search, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/clients', { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setClients(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, []);

  const filtered = clients.filter((c) =>
    `${c.nombre || ''} ${c.telefono || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex h-full text-slate-100 bg-slate-950">
      <section className="flex-1 p-8 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Clientes y Prospectos</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Fichas de clientes, historial de pedidos y sincronización con Google Contacts.
            </p>
          </div>

          <Link href="/dashboard/crm">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40">
              <Kanban className="w-4 h-4" />
              Ver Tablero Kanban CRM
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </Link>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            aria-label="Buscar contactos"
            className="bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-3 w-full text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold uppercase text-slate-400">
                <th className="p-4">Nombre</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Relación / Estado</th>
                <th className="p-4">Google Contacts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((c) => (
                <tr key={c.id || c.telefono} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-emerald-400 hover:text-emerald-300 hover:underline text-left"
                    >
                      {c.nombre || 'Sin nombre'}
                    </button>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{c.telefono}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                      {c.status || 'Activo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        c.googleSyncStatus === 'synced'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.googleSyncStatus === 'synced' ? 'Sincronizado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length && (
            <div className="p-8 text-center text-slate-500 text-sm">
              {clients.length === 0
                ? 'Conecta WhatsApp o actualiza los clientes desde la bandeja de Mensajes.'
                : 'No se encontraron contactos con ese criterio.'}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <aside className="w-96 border-l border-white/5 bg-slate-900/60 p-4">
          <CrmPanel key={selected.id || selected.telefono} phone={selected.telefono} />
        </aside>
      )}
    </main>
  );
}
