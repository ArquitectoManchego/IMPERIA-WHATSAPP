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
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { BulkEditModal } from '@/components/clientes/BulkEditModal';
import { ContactDetailsSheet } from '@/components/clientes/ContactDetailsSheet';
import { CheckCircle2 } from 'lucide-react';

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
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [selectedContactForView, setSelectedContactForView] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
          compiledNotes: Array.from(noteNumbers).join(', '),
          tags: d.tags || []
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
      setLoading(false);
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

  const handleUpdateContact = async (updatedContact: any) => {
    try {
      const response = await fetch('/api/sync/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-edit',
          selectedContacts: [updatedContact],
          tagsToAdd: [],
          tagsToRemove: []
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');
      
      toast({ title: "Contacto Actualizado", description: "Los cambios se han guardado." });
      fetchTaylorData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const handleMessageContact = (contact: any) => {
    window.location.href = `/dashboard?phone=${contact.telefono}`;
  };

  const handleViewContact = (contact: any) => {
    setSelectedContactForView(contact);
    setIsDetailsOpen(true);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredList.map(c => c.id);
      setSelectedIds(new Set(allIds));
    }
  };

  const activeList = React.useMemo(() => {
    // Helper to clean phone numbers for comparison
    const clean = (p: string) => (p || '').replace(/\D/g, '');

    const taylor = taylorClients.map(c => ({ ...c, source: 'taylor' }));
    
    // Merge Taylor data into Google contacts to show tags/notes
    const google = googleContacts.map(gc => {
      const gcPhone = clean(gc.telefono);
      // Find matching taylor client by phone or cleaned ID
      const match = taylorClients.find(tc => 
        (gcPhone && clean(tc.telefono) === gcPhone) || 
        tc.id === gc.id.replace(/\//g, '_')
      );

      if (match) {
        return {
          ...gc,
          ...match,
          source: 'google', // Keep source as google but with taylor data
          isImported: true
        };
      }
      return { ...gc, source: 'google', isImported: false };
    });

    if (view === 'taylor') return taylor;
    if (view === 'google') return google;
    
    // For 'all' view, show all Taylor + Google contacts that aren't already in Taylor
    const uniqueGoogle = google.filter(gc => !gc.isImported);
    return [...taylor, ...uniqueGoogle];
  }, [view, taylorClients, googleContacts]);

  const filteredList = activeList.filter(c => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.nombre || '').toLowerCase().includes(search) ||
      (c.telefono || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      (c.compiledNotes || '').toLowerCase().includes(search) ||
      (c.tags && c.tags.some((t: string) => t.toLowerCase().includes(search))); // Search in tags!
    
    const matchesTags = filterTags.length === 0 || 
      (c.tags && filterTags.every(tag => c.tags.includes(tag)));

    return matchesSearch && matchesTags;
  });

  const allAvailableTags = React.useMemo(() => {
    const tags = new Set<string>();
    taylorClients.forEach(c => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [taylorClients]);

  const toggleFilterTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };

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
          <p className="text-slate-400 text-sm font-medium">Gestión avanzada de clientes, etiquetas y sincronización.</p>
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

      {/* Tag Filters */}
      {allAvailableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-full mb-1">Filtrar por Etiquetas:</p>
          {allAvailableTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleFilterTag(tag)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filterTags.includes(tag) 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
              )}
            >
              {tag}
            </button>
          ))}
          {filterTags.length > 0 && (
            <button 
              onClick={() => setFilterTags([])}
              className="px-4 py-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="glass rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, nota o etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <>
                <Button 
                  onClick={() => setBulkEditOpen(true)}
                  className="h-12 bg-emerald-500 text-white hover:bg-emerald-600 transition-all rounded-2xl px-8 gap-2 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
                >
                  <Tag className="w-4 h-4" />
                  Edición Masiva ({selectedIds.size})
                </Button>
                <Button 
                  disabled={syncing}
                  onClick={handleSync}
                  variant="outline"
                  className="h-12 bg-white/5 text-white border-white/10 hover:bg-white/10 transition-all rounded-2xl px-8 gap-2 font-bold uppercase tracking-widest text-[10px]"
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                  Sincronizar
                </Button>
              </>
            )}

            {view === 'all' && googleContacts.length > 0 && selectedIds.size === 0 && (
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
        </div>

        <div className="overflow-x-auto h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#09090b] z-20">
              <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-6 w-10 text-center">
                  <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-6 h-6 rounded-lg border transition-all flex items-center justify-center",
                      selectedIds.size > 0 && selectedIds.size === filteredList.length 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-white/10 text-slate-800"
                    )}
                  >
                    {selectedIds.size > 0 && <CheckSquare className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Notas / Etiquetas</th>
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
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No se encontraron contactos</p>
                  </td>
                </tr>
              ) : filteredList.map((contact) => (
                <tr 
                  key={contact.id} 
                  onClick={() => handleMessageContact(contact)}
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="px-8 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => toggleSelect(contact.id)}
                      className={cn(
                        "w-6 h-6 rounded-lg border transition-all flex items-center justify-center",
                        selectedIds.has(contact.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10 text-slate-800"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">{contact.nombre || 'Sin Nombre'}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleViewContact(contact); }}
                            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-emerald-500 hover:text-white rounded-md transition-all"
                          >
                            Ver
                          </Button>
                        </div>
                        <p className="text-[11px] text-slate-500">{contact.telefono}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {contact.tags && contact.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                         {contact.compiledNotes ? contact.compiledNotes.split(', ').map((n: string) => (
                           <span key={n} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-slate-400">#{n}</span>
                         )) : !contact.tags?.length && <span className="text-[9px] text-slate-700 font-bold uppercase italic">Sin Info</span>}
                      </div>
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
                  <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    {contact.source === 'google' && !contact.isImported ? (
                      <Button 
                        size="sm"
                        onClick={() => importClient(contact)}
                        className="h-10 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] transition-all"
                      >
                        <Database className="w-3 h-3" />
                        Importar
                      </Button>
                    ) : contact.isImported ? (
                      <div className="flex flex-col items-end">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sincronizado
                        </div>
                        <div className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">En Taylor</div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Registrado</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BulkEditModal 
        isOpen={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedIds={selectedIds}
        contacts={activeList}
        onSuccess={() => {
          fetchTaylorData();
          setSelectedIds(new Set());
          toast({ title: "Cambios Aplicados", description: "Los contactos han sido actualizados correctamente." });
        }}
      />
      <ContactDetailsSheet 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        contact={selectedContactForView}
        onUpdate={handleUpdateContact}
      />
    </div>
  );
}
