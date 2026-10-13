'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Zap, 
  Tag, 
  MessageSquare, 
  Clock, 
  Power, 
  Share2, 
  UserCheck, 
  Sliders, 
  Trash2, 
  Check,
  Send,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationRule } from '@/lib/crm-domain';

export default function AutomationsPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<'keyword' | 'stage_changed' | 'inactivity'>('keyword');
  const [keywordPattern, setKeywordPattern] = useState('');
  const [actionType, setActionType] = useState<'send_message' | 'add_tag' | 'change_stage'>('send_message');
  const [actionPayload, setActionPayload] = useState('');
  const [handoffToHuman, setHandoffToHuman] = useState(true);

  // WhatsApp Status Update Publisher
  const [statusText, setStatusText] = useState('');
  const [publishingStatus, setPublishingStatus] = useState(false);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/automations');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch('/api/crm/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id, active: !currentActive }),
      });
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: !currentActive } : r));
      toast({ title: !currentActive ? 'Regla activada' : 'Regla desactivada' });
    } catch (_) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !actionPayload.trim()) return;

    try {
      const res = await fetch('/api/crm/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          trigger,
          keywordPattern: trigger === 'keyword' ? keywordPattern.trim() : undefined,
          actionType,
          actionPayload: actionPayload.trim(),
          active: true,
          handoffToHuman,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar regla');
      toast({ title: 'Automatización configurada' });
      setIsCreating(false);
      setName('');
      setKeywordPattern('');
      setActionPayload('');
      loadRules();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Publish Status update
  const handlePublishStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim()) return;

    setPublishingStatus(true);
    try {
      // OpenWA Gateway session status endpoint
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: 'status@broadcast',
          message: statusText.trim(),
          requestId: crypto.randomUUID(),
        }),
      });

      if (res.ok) {
        toast({ title: 'Estado de WhatsApp publicado con éxito' });
        setStatusText('');
      } else {
        toast({
          title: 'Aviso sobre Estados',
          description: 'La publicación de estados requiere permiso de sesión activa en OpenWA Gateway.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPublishingStatus(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#030712] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 glass flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Automatizaciones & Chatbot Sin Código</h1>
            <p className="text-xs text-slate-400">Reglas condicionales, respuestas automáticas y transferencia humana</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Ver Reglas' : 'Nueva Automatización'}</span>
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* WhatsApp Status Broadcast Tool */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              Publicación Automática en Estados de WhatsApp
            </h3>
            <span className="text-[10px] text-slate-500">Integración nativa OpenWA</span>
          </div>
          <form onSubmit={handlePublishStatus} className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe el texto de tu estado (ej. ¡Nuevos trajes de graduación en tienda!)..."
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              disabled={publishingStatus || !statusText.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publicar Estado</span>
            </button>
          </form>
        </div>

        {isCreating ? (
          /* Rule Builder Form */
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Configurar Regla de Automatización
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nombre de la regla
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Respuesta de bienvenida o Etiquetar vestidos"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              {/* Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    Disparador (Trigger)
                  </label>
                  <select
                    value={trigger}
                    onChange={e => setTrigger(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  >
                    <option value="keyword">Mensaje contiene palabras clave</option>
                    <option value="stage_changed">Cambio de etapa en el CRM</option>
                    <option value="inactivity">Cliente inactivo por más de 3 días</option>
                  </select>
                </div>

                {trigger === 'keyword' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                      Palabras clave (separadas por barra |)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="hola|precios|cotizacion"
                      value={keywordPattern}
                      onChange={e => setKeywordPattern(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    Acción a ejecutar
                  </label>
                  <select
                    value={actionType}
                    onChange={e => setActionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  >
                    <option value="send_message">Enviar respuesta automática por WhatsApp</option>
                    <option value="add_tag">Agregar etiqueta al contacto</option>
                    <option value="change_stage">Mover a etapa comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                    {actionType === 'send_message' ? 'Mensaje a enviar' : actionType === 'add_tag' ? 'Nombre de etiqueta' : 'ID o nombre de etapa'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={actionType === 'send_message' ? '¡Hola! Gracias por escribir a IMPERIA...' : 'Graduación'}
                    value={actionPayload}
                    onChange={e => setActionPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Human Handoff */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handoffToHuman}
                  onChange={e => setHandoffToHuman(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300">
                  Pausar automatización cuando el usuario responda para permitir <strong>atención humana</strong> directa.
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Rules List */
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{rule.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      rule.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {rule.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Disparador: <strong>{rule.trigger}</strong> {rule.keywordPattern ? `(${rule.keywordPattern})` : ''}</span>
                    <span>→</span>
                    <span>Acción: <strong>{rule.actionType}</strong> ({rule.actionPayload})</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(rule.id, rule.active)}
                    className={`p-2 rounded-xl transition-all ${
                      rule.active
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 hover:text-white'
                    }`}
                    title={rule.active ? 'Desactivar regla' : 'Activar regla'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                No hay reglas de automatización configuradas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
