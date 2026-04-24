'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Tag, 
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckSquare,
  Square,
  Database,
  Globe,
  ArrowRightLeft,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [taylorClients, setTaylorClients] = useState<any[]>([]);
  const [googleContacts, setGoogleContacts] = useState<any[]>([]);
  const [view, setView] = useState<'taylor' | 'google' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTaylorData();
  }, []);

  useEffect(() => {
    if (session) {
      fetchGoogleData();
    }
  }, [session]);

  const fetchTaylorData = async () => {
    setLoading(true);
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientsPath = `artifacts/${projectId}/public/data/clients`;
      
      console.log('[ClientesPage] Fetching from Firestore:', clientsPath);
      
      const q = query(collection(db, clientsPath));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        const noteNumbers = new Set<string>();
        if (d.nota_id) noteNumbers.add(d.nota_id);
        if (Array.isArray(d.abonos)) {
          d.abonos.forEach((a: any) => {
            if (a.numero_nota) noteNumbers.add(a.numero_nota);
          });
        }
        return {
          id: doc.id,
          ...d,
          compiledNotes: Array.from(noteNumbers).join(', ')
        };
      });
      
      setTaylorClients(data);
    } catch (err) {
      console.error('Error fetching Taylor clients:', err);
      toast({ 
        title: "Error de Conexión", 
        description: "No se pudieron cargar los clientes de Firebase. Verifica tu conexión.",
        variant: "destructive" 
      });
    } finally {
      if (!session) setLoading(false);
    }
  };

  const fetchGoogleData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync/contacts');
      const data = await res.json();
      if (!data.error) setGoogleContacts(data);
    } catch (err) {
      console.error('Error fetching Google contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const importClient = async (contact: any) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          contacts: [contact]
        })
      });

      const result = await res.json();
      if (result.success) {
        toast({ title: "Cliente Importado", description: `${contact.nombre} se guardó en Firebase.` });
        fetchTaylorData();
      }
    } catch (err) {
      toast({ title: "Error", description: "No se pudo importar el cliente.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;
    setSyncing(true);
    
    try {
      const selectedList = view === 'google' 
        ? googleContacts.filter(c => selectedIds.has(c.id))
        : taylorClients.filter(c => selectedIds.has(c.id));

      const res = await fetch('/api/sync/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: (view === 'google' || view === 'all') ? 'import' : 'push',
          contacts: (view === 'google' || view === 'all') ? googleContacts.filter(c => selectedIds.has(c.id) && c.source === 'google') : [],
          clients: view === 'taylor' ? selectedList : []
        })
      });

      const result = await res.json();
      if (result.success) {
        toast({ title: "Sincronización Exitosa", description: result.message });
        setSelectedIds(new Set());
        fetchTaylorData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Ocurrió un problema al sincronizar.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const activeList = React.useMemo(() => {
    const taylor = taylorClients.map(c => ({ ...c, source: 'taylor' }));
    const google = googleContacts.map(c => ({ ...c, source: 'google' }));

    if (view === 'taylor') return taylor;
    if (view === 'google') return google;
    
    // Combined view: prioritize taylor if duplicate phone? (Optional improvement)
    // For now, just concatenate.
    return [...taylor, ...google];
  }, [view, taylorClients, googleContacts]);

  const filteredList = activeList.filter(c => 
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.telefono || '').includes(searchTerm) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.compiledNotes || '').includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col p-8 gap-8 relative z-10 overflow-y-auto">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Centro de Contactos</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Sincronización bidireccional entre TAYLOR y Google Contacts.</p>
        </div>

        <div className="flex items-center gap-3">
          {status === "unauthenticated" ? (
             <Button 
               onClick={() => signIn('google')}
               className="h-12 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all rounded-2xl px-6 gap-2 font-black tracking-widest uppercase text-[10px]"
             >
                <LogIn className="w-4 h-4" />
                Vincular Google
             </Button>
          ) : (
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Google Activo</span>
               </div>
               <Button 
                 variant="ghost" 
                 onClick={() => signOut()}
                 className="text-[9px] font-bold text-slate-500 hover:text-red-400"
               >
                 Desvincular
               </Button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs / Switcher */}
      <div className="flex gap-4">
        <button 
          onClick={() => { setView('all'); setSelectedIds(new Set()); }}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 rounded-3xl border transition-all flex items-center gap-3",
            view === 'all' ? "bg-white/10 border-white/30 text-white" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
          )}
        >
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#09090b] z-10">
               <Database className="w-3 h-3 text-white" />
            </div>
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#09090b]">
               <Globe className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Vista Maestra</p>
            <p className="text-xs font-bold">Todos los Clientes</p>
          </div>
        </button>

        <button 
          onClick={() => { setView('taylor'); setSelectedIds(new Set()); }}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 rounded-3xl border transition-all flex items-center gap-3",
            view === 'taylor' ? "bg-emerald-500/10 border-emerald-500/30 text-white" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
          )}
        >
          <Database className="w-5 h-5" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Base de Datos</p>
            <p className="text-xs font-bold">Taylor Firestore</p>
          </div>
        </button>
        <button 
          onClick={() => { setView('google'); setSelectedIds(new Set()); }}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 rounded-3xl border transition-all flex items-center gap-3",
            view === 'google' ? "bg-blue-500/10 border-blue-500/30 text-white" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
          )}
        >
          <Globe className="w-5 h-5" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Nube Personal</p>
            <p className="text-xs font-bold">Google Contacts</p>
          </div>
        </button>
      </div>

      {/* Table Section */}
      <div className="glass rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          
          {selectedIds.size > 0 && (
            <Button 
              disabled={syncing}
              onClick={handleSync}
              className="h-12 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all rounded-2xl px-8 gap-2 font-bold uppercase tracking-widest text-[10px]"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              {view === 'google' || view === 'all' ? `Importar ${selectedIds.size} a Taylor` : `Subir ${selectedIds.size} a Google`}
            </Button>
          )}

          {view === 'all' && googleContacts.length > 0 && (
             <Button 
               variant="outline"
               onClick={() => {
                 const allToImport = googleContacts.filter(gc => !taylorClients.some(tc => tc.telefono === gc.telefono));
                 if (allToImport.length > 0) {
                    setSelectedIds(new Set(allToImport.map(c => c.id)));
                    toast({ title: "Importación Masiva", description: `Se han seleccionado ${allToImport.length} contactos nuevos para importar.` });
                 }
               }}
               className="h-12 bg-white/5 text-slate-400 hover:bg-emerald-500 hover:text-white border-white/10 rounded-2xl px-6 gap-2 font-black tracking-widest uppercase text-[10px]"
             >
               <Database className="w-4 h-4" />
               Cargar todo a Firebase
             </Button>
          )}
        </div>

        <div className="overflow-x-auto h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#09090b] z-20">
              <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-6 w-10 text-center">✓</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Notas / Info</th>
                <th className="px-8 py-6">Origen</th>
                <th className="px-8 py-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando con {view === 'all' ? 'Fuentes Master' : view === 'taylor' ? 'Taylor' : 'Google'}...</p>
                  </td>
                </tr>
              ) : filteredList.map((contact) => (
                <tr key={contact.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => toggleSelect(contact.id)}
                      disabled={contact.source === 'taylor' && view === 'all'}
                      className={cn(
                        "w-6 h-6 rounded-lg border transition-all flex items-center justify-center",
                        selectedIds.has(contact.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10 text-slate-800",
                        contact.source === 'taylor' && view === 'all' && "opacity-20 cursor-not-allowed"
                      )}
                    >
                      {selectedIds.has(contact.id) && <CheckSquare className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 text-white font-black">
                        {contact.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{contact.nombre}</p>
                        <p className="text-[11px] text-slate-500">{contact.telefono}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                       {contact.compiledNotes ? contact.compiledNotes.split(', ').map((n: string) => (
                         <span key={n} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-slate-400">#{n}</span>
                       )) : <span className="text-[9px] text-slate-700 font-bold uppercase italic">Sin Notas</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      contact.source === 'taylor' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {contact.source === 'taylor' ? <Database className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {contact.source === 'taylor' ? 'Taylor' : 'Google'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {contact.source === 'google' ? (
                       <Button 
                         size="sm"
                         onClick={() => importClient(contact)}
                         className="h-8 bg-emerald-500 hover:bg-emerald-600 text-[9px] font-black uppercase tracking-widest px-4 rounded-xl gap-2"
                       >
                         <Plus className="w-3 h-3" />
                         Firebase
                       </Button>
                    ) : (
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Registrado</span>
                    )}
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
