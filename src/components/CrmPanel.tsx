'use client';

import React, { useEffect, useState } from 'react';
import { 
  User, 
  Phone, 
  Tag, 
  DollarSign, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Plus, 
  Trash2, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCrmUi } from '@/context/CrmUiContext';
import { isContactInactive, getMexicoCityDateTime, PipelineStage, OpportunityDeal, ScheduledItem } from '@/lib/crm-domain';

export default function CrmPanel({ phone }: { phone: string }) {
  const { toast } = useToast();
  const { privacyMode, t } = useCrmUi();

  const [context, setContext] = useState<any>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form states
  const [activeTab, setActiveTab] = useState<'info' | 'deals' | 'scheduled' | 'timeline' | 'orders'>('info');
  const [editName, setEditName] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('nota');

  // New Deal form state
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAmount, setNewDealAmount] = useState('');
  const [newDealCurrency, setNewDealCurrency] = useState('MXN');

  // New Scheduled message form state
  const [scheduleType, setScheduleType] = useState<'whatsapp_message' | 'internal_reminder'>('whatsapp_message');
  const [scheduleContent, setScheduleContent] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  // Fetch contact data & pipeline stages
  const load = async (controller?: AbortController) => {
    if (!phone || phone.endsWith('@lid')) return;
    try {
      setError('');
      const [resContext, resStages] = await Promise.all([
        fetch(`/api/crm/context?phone=${encodeURIComponent(phone)}`, { signal: controller?.signal }),
        fetch('/api/crm/pipeline', { signal: controller?.signal })
      ]);

      const dataContext = await resContext.json();
      if (!resContext.ok) throw new Error(dataContext.error || 'Error al cargar ficha');
      setContext(dataContext);
      setEditName(dataContext.contact?.nombre || '');

      if (resStages.ok) {
        const dataStages = await resStages.json();
        setStages(dataStages.stages || []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller);
    const interval = setInterval(() => load(), 20000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [phone]);

  const save = async (patch: any) => {
    setSaveStatus('saving');
    setError('');
    try {
      const res = await fetch('/api/crm/context', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContext(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: any) {
      setError(e.message);
      setSaveStatus('idle');
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' });
    }
  };

  // Add tag handler
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !context) return;
    const currentTags = context.tags || [];
    if (currentTags.includes(newTagInput.trim())) return;
    const nextTags = [...currentTags, newTagInput.trim()];
    save({ tags: nextTags });
    setNewTagInput('');
  };

  // Remove tag handler
  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = (context.tags || []).filter((t: string) => t !== tagToRemove);
    save({ tags: nextTags });
  };

  // Add deal handler
  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim() || !newDealAmount) return;
    save({
      deal: {
        title: newDealTitle.trim(),
        amount: parseFloat(newDealAmount) || 0,
        currency: newDealCurrency,
        stage: context.stage || 'nuevo',
        status: 'abierta',
      }
    });
    setNewDealTitle('');
    setNewDealAmount('');
  };

  // Add scheduled item handler
  const handleAddScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleContent.trim() || !scheduleDateTime) return;
    save({
      scheduled: {
        type: scheduleType,
        content: scheduleContent.trim(),
        scheduledFor: new Date(scheduleDateTime).toISOString(),
      }
    });
    setScheduleContent('');
    setScheduleDateTime('');
  };

  // Google Calendar Link generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Cita con cliente: ${context?.contact?.nombre || phone}`);
    const details = encodeURIComponent(`Cita comercial / Toma de medidas IMPERIA.\nTeléfono: ${phone}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  };

  if (!phone || phone.endsWith('@lid')) {
    return (
      <aside className="p-6 text-slate-400 text-xs">
        Este chat usa un identificador sin teléfono directo resuelto.
      </aside>
    );
  }

  if (!context) {
    return (
      <aside className="p-6 text-slate-400 text-xs flex items-center justify-center h-full">
        Cargando ficha del cliente...
      </aside>
    );
  }

  const inactivity = isContactInactive(context.contact?.updatedAt || context.contact?.createdAt, 3);
  const totalDealsAmount = (context.deals || []).reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

  return (
    <aside className="w-full h-full overflow-y-auto bg-slate-950/95 border-l border-white/5 text-slate-100 text-xs flex flex-col select-none">
      {/* Top Header Card */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-sm ring-1 ring-white/10 shrink-0">
              {(context.contact.nombre || phone).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-white truncate blur-sensitive">
                {context.contact.nombre || 'Sin nombre'}
              </h2>
              <p className="text-[11px] text-slate-400 blur-sensitive">
                {context.contact.telefono}
              </p>
            </div>
          </div>

          {/* Save Status Badge */}
          <div className="shrink-0 text-right">
            {saveStatus === 'saving' && (
              <span className="text-[10px] text-amber-400 font-medium animate-pulse">Guardando...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Guardado
              </span>
            )}
          </div>
        </div>

        {/* Inactivity banner if > 3 days */}
        {inactivity.inactive && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Sin seguimiento hace <strong>{inactivity.days} días</strong></span>
          </div>
        )}

        {/* Stage Selector */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-slate-400 text-[11px]">Etapa:</span>
          <select
            value={context.stage || 'nuevo'}
            onChange={e => save({ stage: e.target.value })}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-semibold focus:outline-none"
          >
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-2 shrink-0 overflow-x-auto text-[11px]">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-all ${
            activeTab === 'info' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('deals')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'deals' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Negocios
          {(context.deals || []).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-emerald-400 font-bold">
              {context.deals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'scheduled' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Programados
          {(context.scheduled || []).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-sky-400 font-bold">
              {context.scheduled.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'orders' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Pedidos
          {(context.orders || []).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-400 font-bold">
              {context.orders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-all ${
            activeTab === 'timeline' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Bitácora
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* TAB 1: General Info & Tags */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Quick Name Edit */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold uppercase">Nombre confirmado</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nombre completo"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => save({ nombre: editName.trim() })}
                  disabled={!editName.trim() || editName === context.contact.nombre}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold text-xs"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Tags section */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase">Etiquetas comerciales</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(context.tags || []).map((t: string) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-[11px]"
                  >
                    {t}
                    <button onClick={() => handleRemoveTag(t)} className="text-slate-400 hover:text-rose-400">
                      ×
                    </button>
                  </span>
                ))}
                {(context.tags || []).length === 0 && (
                  <p className="text-slate-500 text-[11px]">Sin etiquetas asignadas.</p>
                )}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva etiqueta (ej. Uniforme, Noviembre)..."
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button type="submit" className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg">
                  + Agregar
                </button>
              </form>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={!!context.contact.notificationsConsent}
                onChange={e => save({ notificationsConsent: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-300">
                El cliente autorizó recibir avisos y notificaciones de pedidos por WhatsApp.
              </span>
            </label>

            {/* Google Sync and Calendar Tools */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Google Contacts:</span>
                <span className={`font-semibold ${context.contact.googleSyncStatus === 'synced' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {context.contact.googleSyncStatus === 'synced' ? 'Sincronizado' : 'Pendiente'}
                </span>
              </div>
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold text-[11px] pt-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar Cita en Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: Deals & Opportunities */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-slate-300 font-semibold">Total en Oportunidades:</span>
              <span className="text-sm font-bold text-emerald-400 blur-sensitive">
                ${totalDealsAmount.toLocaleString()} MXN
              </span>
            </div>

            {/* Deals List */}
            <div className="space-y-2">
              {(context.deals || []).map((deal: OpportunityDeal) => (
                <div key={deal.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white blur-sensitive">{deal.title}</h4>
                    <span className="font-bold text-emerald-400 blur-sensitive">
                      ${Number(deal.amount).toLocaleString()} {deal.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Etapa: {deal.stage}</span>
                    <span>{new Date(deal.createdAt).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
              ))}
              {(context.deals || []).length === 0 && (
                <p className="text-slate-500 text-center py-4">No hay oportunidades registradas para este cliente.</p>
              )}
            </div>

            {/* Create Deal Form */}
            <form onSubmit={handleAddDeal} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Nueva Oportunidad
              </h4>
              <input
                type="text"
                required
                placeholder="Descripción (ej. Uniforme médico 4 pzas)"
                value={newDealTitle}
                onChange={e => setNewDealTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Monto (ej. 2400)"
                  value={newDealAmount}
                  onChange={e => setNewDealAmount(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <select
                  value={newDealCurrency}
                  onChange={e => setNewDealCurrency(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all"
              >
                Agregar Oportunidad
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Scheduled Messages & Reminders */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {(context.scheduled || []).map((sch: ScheduledItem) => (
                <div key={sch.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      sch.type === 'internal_reminder' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {sch.type === 'internal_reminder' ? 'Recordatorio Interno' : 'Mensaje WhatsApp'}
                    </span>
                    <span className={`text-[10px] font-semibold ${sch.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sch.status}
                    </span>
                  </div>
                  <p className="text-white text-xs mt-1 blur-sensitive">{sch.content}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>Para: {new Date(sch.scheduledFor).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} (CDMX)</span>
                  </p>
                </div>
              ))}
              {(context.scheduled || []).length === 0 && (
                <p className="text-slate-500 text-center py-4">No hay mensajes o recordatorios programados.</p>
              )}
            </div>

            {/* Schedule new form */}
            <form onSubmit={handleAddScheduled} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Programar Mensaje o Recordatorio
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('whatsapp_message')}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold ${
                    scheduleType === 'whatsapp_message' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Mensaje al Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('internal_reminder')}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold ${
                    scheduleType === 'internal_reminder' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Recordatorio Interno
                </button>
              </div>

              <textarea
                required
                rows={2}
                placeholder={scheduleType === 'whatsapp_message' ? 'Texto que se enviará al cliente...' : 'Recordatorio para el equipo...'}
                value={scheduleContent}
                onChange={e => setScheduleContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Fecha y hora (Zona Horaria America/Mexico_City)</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDateTime}
                  onChange={e => setScheduleDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all"
              >
                Programar
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {context.orders.map((o: any) => (
              <OrderCard key={o.id} order={o} />
            ))}
            {context.orders.length === 0 && (
              <p className="text-slate-500 text-center py-6">Sin pedidos asociados en el sistema.</p>
            )}
          </div>
        )}

        {/* TAB 5: Timeline / Notes */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <form onSubmit={e => {
              e.preventDefault();
              if (noteText.trim()) {
                save({ note: noteText.trim(), type: noteType });
                setNoteText('');
              }
            }} className="space-y-2">
              <select
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="nota">Nota interna</option>
                <option value="acuerdo">Acuerdo con el cliente</option>
                <option value="peticion">Petición especial</option>
                <option value="incidencia">Incidencia / Retraso</option>
              </select>
              <textarea
                rows={3}
                placeholder="Registra qué ocurrió o acuerdos..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              />
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold text-xs"
              >
                Agregar a Bitácora
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {context.timeline.map((n: any) => (
                <div key={n.id} className="border-l-2 border-slate-700 pl-3 py-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="capitalize font-semibold text-slate-300">{n.type}</span>
                    <span>{new Date(n.createdAt).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="text-slate-200 text-xs whitespace-pre-wrap blur-sensitive">{n.text}</p>
                  <p className="text-[10px] text-slate-500">{n.author || 'Equipo'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function OrderCard({ order: o }: { order: any }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
  const delayed = o.promisedDate && o.promisedDate.slice(0, 10) < today && !o.delivered && !o.ready;

  return (
    <article className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5 text-xs">
      <div className="flex justify-between items-center gap-2">
        <strong className="text-white">#{o.folio}</strong>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          o.ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
        }`}>
          {o.stage}
        </span>
      </div>
      <p className="text-slate-400 text-[11px]">Compromiso: {o.promisedDate || 'Sin fecha'}</p>
      {o.estimatedDate && <p className="text-slate-400 text-[11px]">Estimación: {o.estimatedDate}</p>}
      {delayed && <p className="text-amber-400 text-[11px] font-semibold">⚠️ Entrega retrasada</p>}
      {o.items && o.items.map((item: any, i: number) => (
        <p key={item.id || i} className="text-slate-300 text-[11px] blur-sensitive">
          {item.cantidad} × {item.descripcion}
        </p>
      ))}
      {o.notes && <p className="text-slate-400 text-[11px] whitespace-pre-wrap">{o.notes}</p>}
    </article>
  );
}
