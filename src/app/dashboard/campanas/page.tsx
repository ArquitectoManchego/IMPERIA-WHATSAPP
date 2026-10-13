'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Tag, 
  FileText, 
  Search, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CampaignItem } from '@/lib/crm-domain';

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Campaign Form State
  const [isCreating, setIsCreating] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [targetStage, setTargetStage] = useState('all');
  const [targetTag, setTargetTag] = useState('all');
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [customCsvRecipients, setCustomCsvRecipients] = useState<Array<{ phone: string; name?: string }>>([]);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCmp, resPipe] = await Promise.all([
        fetch('/api/crm/campaigns'),
        fetch('/api/crm/pipeline')
      ]);

      if (resCmp.ok) {
        const data = await resCmp.json();
        setCampaigns(data);
      }
      if (resPipe.ok) {
        const pipeData = await resPipe.json();
        setContacts(pipeData.contacts || []);
        setStages(pipeData.stages || []);
      }
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute recipient list based on filters or CSV
  const calculatedRecipients = useMemo(() => {
    if (customCsvRecipients.length > 0) {
      return customCsvRecipients;
    }

    return contacts.filter(c => {
      if (targetStage !== 'all' && (c.stage || 'nuevo') !== targetStage) return false;
      if (targetTag !== 'all' && (!Array.isArray(c.tags) || !c.tags.includes(targetTag))) return false;
      if (onlyInactive) {
        const last = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
        const diffDays = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
        if (diffDays < 3) return false;
      }
      return !!c.telefono;
    }).map(c => ({ phone: c.telefono, name: c.nombre || 'Cliente' }));
  }, [contacts, targetStage, targetTag, onlyInactive, customCsvRecipients]);

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      const parsed: Array<{ phone: string; name?: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 1) {
          const rawPhone = cols[0] || cols[1] || '';
          const name = cols[1] || cols[0] || 'Cliente';
          if (rawPhone.replace(/\D/g, '').length >= 10) {
            parsed.push({ phone: rawPhone, name });
          }
        }
      }

      setCustomCsvRecipients(parsed);
      toast({ title: 'CSV Importado', description: `${parsed.length} destinatarios válidos cargados.` });
    };
    reader.readAsText(file);
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !messageTemplate.trim() || calculatedRecipients.length === 0) {
      toast({ title: 'Completa todos los campos y asegúrate de tener destinatarios', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          campaign: {
            name: campaignName.trim(),
            messageTemplate: messageTemplate.trim(),
            status: 'draft',
            recipients: calculatedRecipients.map(r => ({ ...r, status: 'pending' })),
          }
        }),
      });

      if (!res.ok) throw new Error('Error al guardar campaña');
      toast({ title: 'Campaña creada exitosamente' });
      setIsCreating(false);
      setCampaignName('');
      setMessageTemplate('');
      setCustomCsvRecipients([]);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Execute Campaign
  const handleExecuteCampaign = async (campaignId: string) => {
    setExecutingId(campaignId);
    toast({ title: 'Iniciando envío de campaña...' });
    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', campaignId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar campaña');

      toast({
        title: 'Campaña ejecutada',
        description: `Enviados: ${data.campaign.progress.sent} | Fallidos/Restringidos: ${data.campaign.progress.failed}`,
      });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#030712] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 glass flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center ring-1 ring-sky-500/30">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Campañas Masivas & Reactivación</h1>
            <p className="text-xs text-slate-400">Difusión personalizada, reactivación de clientes inactivos y listas CSV</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Ver Campañas' : 'Nueva Campaña'}</span>
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isCreating ? (
          /* Campaign Creator Form */
          <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              Diseñar Nueva Campaña Masiva
            </h2>

            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nombre de la campaña
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Promoción Trajes de Graduación 2026"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              {/* Segment criteria */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  Segmentación de Audiencia
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Por Etapa CRM</label>
                    <select
                      value={targetStage}
                      onChange={e => setTargetStage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="all">Todas las etapas</option>
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Reactivar Inactivos</label>
                    <button
                      type="button"
                      onClick={() => setOnlyInactive(!onlyInactive)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        onlyInactive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>Inactivos (&gt;3d)</span>
                      {onlyInactive && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Importar desde CSV</label>
                    <label className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customCsvRecipients.length > 0 ? `${customCsvRecipients.length} cargados` : 'Subir archivo CSV'}</span>
                      <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <span>Destinatarios seleccionados:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    {calculatedRecipients.length} contactos
                  </span>
                </div>
              </div>

              {/* Message template */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Plantilla del Mensaje
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMessageTemplate(prev => prev + ' {{nombre}}')}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-sky-400 hover:bg-slate-700"
                    >
                      + Variable {`{{nombre}}`}
                    </button>
                  </div>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="¡Hola {{nombre}}! Te contactamos de IMPERIA con una gran noticia..."
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {/* Live Preview Box */}
              {messageTemplate && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-400">Vista previa personalizada:</p>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap">
                    {messageTemplate.replace(/\{\{nombre\}\}/gi, calculatedRecipients[0]?.name || 'Carlos')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950"
                >
                  Guardar Campaña
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Campaigns List */
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="grid gap-4">
              {campaigns.map(cmp => (
                <div
                  key={cmp.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {cmp.name}
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          cmp.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : cmp.status === 'running'
                            ? 'bg-sky-500/20 text-sky-400 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cmp.status}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Creada el {new Date(cmp.createdAt).toLocaleDateString('es-MX')} · {cmp.recipients?.length || 0} destinatarios
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecuteCampaign(cmp.id)}
                        disabled={executingId === cmp.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{executingId === cmp.id ? 'Enviando...' : 'Iniciar Envío'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {cmp.progress && cmp.progress.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Progreso de envío</span>
                        <span>
                          {cmp.progress.sent} / {cmp.progress.total} completados ({cmp.progress.failed} fallidos/bloqueados)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${Math.round((cmp.progress.sent / cmp.progress.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Message body preview */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 whitespace-pre-wrap">
                    {cmp.messageTemplate}
                  </div>
                </div>
              ))}

              {campaigns.length === 0 && (
                <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm">No has creado campañas de difusión todavía.</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Crear mi primera campaña
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
