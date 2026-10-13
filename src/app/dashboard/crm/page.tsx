'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Kanban as KanbanIcon, 
  List, 
  Search, 
  Plus, 
  Filter, 
  DollarSign, 
  Clock, 
  Tag, 
  MessageSquare, 
  MoreVertical, 
  Download, 
  Upload, 
  Trash2, 
  Edit2, 
  Check, 
  ChevronRight, 
  AlertTriangle,
  User,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCrmUi } from '@/context/CrmUiContext';
import { useToast } from '@/components/ui/use-toast';
import { PipelineStage, OpportunityDeal, isContactInactive } from '@/lib/crm-domain';

export default function CrmKanbanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { privacyMode, t, setIsNewChatModalOpen } = useCrmUi();

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<OpportunityDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Tabs
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Stage editing modal/state
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false);

  // New deal quick modal
  const [selectedContactForDeal, setSelectedContactForDeal] = useState<any | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [dealCurrency, setDealCurrency] = useState('MXN');

  // Drag and Drop State
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  // Fetch Pipeline Data
  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/pipeline');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar pipeline');

      setStages(data.stages || []);
      setContacts(data.contacts || []);
      setDeals(data.deals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  // Compute available tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    contacts.forEach(c => {
      if (Array.isArray(c.tags)) c.tags.forEach((t: string) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [contacts]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      const matchesSearch = !search || 
        (contact.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (contact.telefono || '').includes(search);

      // Tag filter
      const matchesTag = selectedTag === 'all' || 
        (Array.isArray(contact.tags) && contact.tags.includes(selectedTag));

      // Inactivity filter (> 3 days)
      const inactivity = isContactInactive(contact.updatedAt || contact.createdAt, 3);
      const matchesInactivity = !inactiveOnly || inactivity.inactive;

      return matchesSearch && matchesTag && matchesInactivity;
    });
  }, [contacts, search, selectedTag, inactiveOnly]);

  // Move Contact to another stage
  const moveContactStage = async (phone: string, targetStageId: string) => {
    // Optimistic update
    setContacts(prev => prev.map(c => c.telefono === phone ? { ...c, stage: targetStageId } : c));

    try {
      const res = await fetch('/api/crm/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move_stage', phone, stageId: targetStageId }),
      });
      if (!res.ok) throw new Error('Error al actualizar etapa');
    } catch (err: any) {
      toast({ title: 'Error al mover contacto', description: err.message, variant: 'destructive' });
      loadPipeline(); // rollback
    }
  };

  // Add Opportunity Deal
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactForDeal || !dealTitle || !dealAmount) return;

    try {
      const res = await fetch('/api/crm/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_deal',
          deal: {
            contactId: selectedContactForDeal.id,
            title: dealTitle.trim(),
            amount: parseFloat(dealAmount) || 0,
            currency: dealCurrency,
            stage: selectedContactForDeal.stage || 'nuevo',
            status: 'abierta',
          }
        }),
      });

      if (!res.ok) throw new Error('Error al guardar oportunidad');
      toast({ title: 'Oportunidad creada', description: `${dealTitle} - $${dealAmount} ${dealCurrency}` });
      setSelectedContactForDeal(null);
      setDealTitle('');
      setDealAmount('');
      loadPipeline();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Stage Management: Add Stage
  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const newStage: PipelineStage = {
      id: 'stg-' + Date.now(),
      name: newStageName.trim(),
      order: stages.length,
      color: 'violet',
    };
    const updatedStages = [...stages, newStage];
    setStages(updatedStages);
    setIsNewStageModalOpen(false);
    setNewStageName('');

    try {
      await fetch('/api/crm/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_stages', stages: updatedStages }),
      });
    } catch (_) {
      loadPipeline();
    }
  };

  // Stage Management: Delete Stage
  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) {
      toast({ title: 'No permitido', description: 'Debe existir al menos una etapa en el embudo.', variant: 'destructive' });
      return;
    }
    const updatedStages = stages.filter(s => s.id !== stageId);
    setStages(updatedStages);

    // Reassign contacts from this stage to the first stage
    const fallbackStageId = updatedStages[0].id;
    setContacts(prev => prev.map(c => c.stage === stageId ? { ...c, stage: fallbackStageId } : c));

    try {
      await fetch('/api/crm/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_stages', stages: updatedStages }),
      });
    } catch (_) {
      loadPipeline();
    }
  };

  // Stage Management: Rename Stage
  const handleSaveRenameStage = async () => {
    if (!editingStage || !newStageName.trim()) return;
    const updatedStages = stages.map(s => s.id === editingStage.id ? { ...s, name: newStageName.trim() } : s);
    setStages(updatedStages);
    setEditingStage(null);
    setNewStageName('');

    try {
      await fetch('/api/crm/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_stages', stages: updatedStages }),
      });
    } catch (_) {
      loadPipeline();
    }
  };

  // CSV Export
  const exportCsv = () => {
    const headers = ['ID', 'Nombre', 'Telefono', 'Etapa', 'Etiquetas', 'Total_Oportunidades', 'Estado_Google'];
    const rows = filteredContacts.map(c => [
      c.id,
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${c.telefono || ''}"`,
      `"${c.stage || ''}"`,
      `"${(c.tags || []).join(';')}"`,
      c.dealsTotal || 0,
      c.googleSyncStatus || 'pending'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-white/5 glass flex flex-wrap items-center justify-between gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/30">
            <KanbanIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pipeline Comercial & CRM
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                {filteredContacts.length} contactos
              </span>
            </h1>
            <p className="text-xs text-slate-400">Embudo de ventas con gestión de etapas y oportunidades</p>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tag Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las etiquetas</option>
              {allTags.map(tag => (
                <option key={tag} value={tag} className="bg-slate-900">{tag}</option>
              ))}
            </select>
          </div>

          {/* Inactivity Filter Button */}
          <button
            onClick={() => setInactiveOnly(!inactiveOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              inactiveOnly
                ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Inactivos (&gt;3d)</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'kanban' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista Kanban"
            >
              <KanbanIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista Tabla"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CSV Export */}
          <button
            onClick={exportCsv}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* New Stage Button */}
          <button
            onClick={() => setIsNewStageModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Etapa</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo contacto</span>
          </button>
        </div>
      </header>

      {/* Main Board Content */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-6 overflow-y-hidden touch-pan-x custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Cargando tablero Kanban...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-rose-400 text-sm">
            {error}
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Columns Flow */
          <div className="flex gap-5 h-full items-start min-w-max pb-4">
            {stages.map(stage => {
              const stageContacts = filteredContacts.filter(c => (c.stage || 'nuevo') === stage.id);
              
              // Sum deals for contacts in this column
              const totalAmount = stageContacts.reduce((sum, c) => {
                const contactDeals = deals.filter(d => d.contactId === c.id);
                return sum + contactDeals.reduce((dSum, d) => dSum + (Number(d.amount) || 0), 0);
              }, 0);

              return (
                <div
                  key={stage.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedContactId) {
                      const contact = contacts.find(c => c.id === draggedContactId);
                      if (contact && contact.telefono) {
                        moveContactStage(contact.telefono, stage.id);
                      }
                      setDraggedContactId(null);
                    }
                  }}
                  className="w-80 max-h-full flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden shrink-0 shadow-lg"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        stage.id === 'cliente' ? 'bg-emerald-500' : stage.id === 'negociacion' ? 'bg-amber-500' : 'bg-sky-500'
                      }`} />
                      <h3 className="font-semibold text-sm text-white truncate max-w-[140px]">
                        {stage.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                        {stageContacts.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {totalAmount > 0 && (
                        <span className="text-xs font-bold text-emerald-400 blur-sensitive">
                          ${totalAmount.toLocaleString()}
                        </span>
                      )}
                      <div className="relative group">
                        <button className="p-1 text-slate-500 hover:text-slate-300 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-slate-850 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 hidden group-hover:block z-20">
                          <button
                            onClick={() => {
                              setEditingStage(stage);
                              setNewStageName(stage.name);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Edit2 className="w-3 h-3" /> Renombrar
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cards List in Column */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {stageContacts.map(contact => {
                      const contactDeals = deals.filter(d => d.contactId === contact.id);
                      const dealSum = contactDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                      const inactivity = isContactInactive(contact.updatedAt || contact.createdAt, 3);

                      return (
                        <div
                          key={contact.id}
                          draggable
                          onDragStart={() => setDraggedContactId(contact.id)}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md group relative"
                        >
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-white/5">
                                {(contact.nombre || contact.telefono || '?').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-xs text-white truncate blur-sensitive">
                                  {contact.nombre || 'Sin nombre'}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate blur-sensitive">
                                  {contact.telefono}
                                </p>
                              </div>
                            </div>

                            {/* Inactivity indicator badge */}
                            {inactivity.inactive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0 font-medium" title={`Sin avance hace ${inactivity.days} días`}>
                                <AlertTriangle className="w-3 h-3" />
                                {inactivity.days}d
                              </span>
                            )}
                          </div>

                          {/* Deals tag and amount */}
                          {dealSum > 0 && (
                            <div className="flex items-center gap-1.5 my-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit blur-sensitive">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>${dealSum.toLocaleString()} MXN</span>
                            </div>
                          )}

                          {/* Tags badges */}
                          {Array.isArray(contact.tags) && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 my-2">
                              {contact.tags.map((t: string) => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Quick Actions Footer */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-850 border-slate-800/60 text-xs">
                            <button
                              onClick={() => {
                                const phoneParam = (contact.telefono || '').replace(/\D/g, '');
                                router.push(`/dashboard?phone=${encodeURIComponent(phoneParam)}`);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 text-[11px]"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Abrir Chat</span>
                            </button>

                            <button
                              onClick={() => setSelectedContactForDeal(contact)}
                              className="text-slate-400 hover:text-white font-medium flex items-center gap-1 text-[11px]"
                              title="Registrar Oportunidad"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Oportunidad</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {stageContacts.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                        Arrastra contactos aquí
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Contacto</th>
                  <th>Teléfono</th>
                  <th>Etapa</th>
                  <th>Oportunidades</th>
                  <th>Etiquetas</th>
                  <th>Inactividad</th>
                  <th className="text-right p-3.5">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContacts.map(contact => {
                  const contactDeals = deals.filter(d => d.contactId === contact.id);
                  const dealSum = contactDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                  const inactivity = isContactInactive(contact.updatedAt || contact.createdAt, 3);
                  const currentStage = stages.find(s => s.id === (contact.stage || 'nuevo'))?.name || contact.stage;

                  return (
                    <tr key={contact.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-3.5 font-semibold text-white blur-sensitive">
                        {contact.nombre || 'Sin nombre'}
                      </td>
                      <td className="text-slate-400 blur-sensitive">
                        {contact.telefono}
                      </td>
                      <td>
                        <select
                          value={contact.stage || 'nuevo'}
                          onChange={e => moveContactStage(contact.telefono, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="blur-sensitive">
                        {dealSum > 0 ? (
                          <span className="font-semibold text-emerald-400">${dealSum.toLocaleString()} MXN</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(contact.tags || []).map((t: string) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {inactivity.inactive ? (
                          <span className="text-amber-400 font-medium text-[11px]">{inactivity.days} días</span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">Activo</span>
                        )}
                      </td>
                      <td className="text-right p-3.5">
                        <button
                          onClick={() => {
                            const phoneParam = (contact.telefono || '').replace(/\D/g, '');
                            router.push(`/dashboard?phone=${encodeURIComponent(phoneParam)}`);
                          }}
                          className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg font-medium transition-all"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Opportunity Deal */}
      {selectedContactForDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Nueva Oportunidad de Venta
            </h3>
            <p className="text-xs text-slate-400">
              Para: <strong className="text-slate-200">{selectedContactForDeal.nombre || selectedContactForDeal.telefono}</strong>
            </p>

            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Concepto / Prenda</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Paquete Graduación 3 piezas"
                  value={dealTitle}
                  onChange={e => setDealTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Importe</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2500"
                    value={dealAmount}
                    onChange={e => setDealAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-slate-400 mb-1">Moneda</label>
                  <select
                    value={dealCurrency}
                    onChange={e => setDealCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedContactForDeal(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                >
                  Guardar Oportunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New / Rename Stage */}
      {(isNewStageModalOpen || editingStage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingStage ? 'Renombrar Etapa' : 'Nueva Etapa del Embudo'}
            </h3>

            <input
              type="text"
              autoFocus
              placeholder="Nombre de la etapa"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewStageModalOpen(false);
                  setEditingStage(null);
                  setNewStageName('');
                }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editingStage ? handleSaveRenameStage : handleAddStage}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
