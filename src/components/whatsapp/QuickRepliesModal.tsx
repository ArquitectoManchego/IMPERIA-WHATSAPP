'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Zap, 
  Send, 
  Copy, 
  Trash2, 
  Tag, 
  Search,
  Sparkles,
  ArrowRight,
  User,
  Award,
  Layers
} from 'lucide-react';
import { QuickReply } from '@/lib/crm-domain';
import { useToast } from '@/components/ui/use-toast';
import { 
  replaceTemplateVariables, 
  AVAILABLE_TEMPLATE_VARIABLES, 
  VariableContext 
} from '@/lib/template-variables';

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    text: string, 
    sendImmediately?: boolean, 
    action?: { stage?: string; tag?: string }
  ) => void;
  context?: VariableContext;
}

const CRM_STAGES = [
  'Contacto Inicial',
  'Cotizado / Propuesta',
  'Esperando Anticipo',
  'En Confección',
  'Listo para Entrega',
  'Entregado / Concluido',
  'Seguimiento'
];

export default function QuickRepliesModal({ 
  isOpen, 
  onClose, 
  onSelect,
  context 
}: QuickRepliesModalProps) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [actionStage, setActionStage] = useState('');
  const [actionTag, setActionTag] = useState('');

  const loadReplies = async () => {
    try {
      const res = await fetch('/api/crm/quick-replies');
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadReplies();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(replies.map(r => r.category || 'General')));

  const filteredReplies = replies.filter(r => {
    const matchesSearch = !search || 
      r.title.toLowerCase().includes(search.toLowerCase()) || 
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      (r.actionTag && r.actionTag.toLowerCase().includes(search.toLowerCase())) ||
      (r.actionStage && r.actionStage.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const insertVariableIntoContent = (varTag: string) => {
    setContent(prev => `${prev} ${varTag} `.replace(/\s+/g, ' '));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await fetch('/api/crm/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          shortcut: shortcut.trim().startsWith('/') ? shortcut.trim() : (shortcut.trim() ? `/${shortcut.trim()}` : ''),
          content: content.trim(),
          category: category.trim() || 'General',
          actionStage: actionStage.trim() || undefined,
          actionTag: actionTag.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar plantilla');
      toast({ title: 'Respuesta rápida creada con éxito' });
      setTitle('');
      setShortcut('');
      setContent('');
      setActionStage('');
      setActionTag('');
      setIsCreating(false);
      loadReplies();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/crm/quick-replies?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setReplies(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Plantilla eliminada' });
    } catch (_) {}
  };

  const handleExecuteReply = (reply: QuickReply, sendImmediately: boolean) => {
    const resolvedText = context 
      ? replaceTemplateVariables(reply.content, context)
      : reply.content;

    const action = (reply.actionStage || reply.actionTag) ? {
      stage: reply.actionStage,
      tag: reply.actionTag
    } : undefined;

    onSelect(resolvedText, sendImmediately, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">Respuestas Rápidas & Acciones CRM</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  Variables dinámicas
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {context?.name ? (
                  <span>Aplicando a: <strong className="text-white">{context.name}</strong> ({context.phone})</span>
                ) : (
                  'Inserta o envía plantillas predefinidas en 1 clic con acciones automáticas'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCreating ? 'Ver biblioteca' : 'Nueva plantilla'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Nueva Respuesta Rápida con Acciones
                </h4>
                <span className="text-[11px] text-slate-400">Soporta etiquetas como {'{nombre}'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Título de la plantilla *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Saludo + Cotización formal"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Atajo rápido</label>
                  <input
                    type="text"
                    placeholder="/cotizar"
                    value={shortcut}
                    onChange={e => setShortcut(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="Ventas, Cotizaciones, Entregas, Calidad, Saludos..."
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Variable Insertion Pills */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Insertar variables dinámicas en el mensaje (clic para añadir):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TEMPLATE_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariableIntoContent(v.tag)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/80 rounded-md text-[11px] font-mono flex items-center gap-1 transition"
                      title={v.label}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{v.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Contenido del mensaje *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Hola {primer_nombre}, le compartimos la cotización de uniformes para {empresa}..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* Actions attached */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Acciones automáticas en CRM al enviar esta plantilla:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Mover automáticamente a Etapa:</label>
                    <select
                      value={actionStage}
                      onChange={e => setActionStage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">(Sin cambio de etapa)</option>
                      {CRM_STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Asignar Etiqueta al contacto:</label>
                    <input
                      type="text"
                      placeholder="Ej. Cotizado, Urgente, VIP..."
                      value={actionTag}
                      onChange={e => setActionTag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                    </input>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950 transition"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Filter and Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por título, contenido, atajo (/hola) o acción..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Templates List */}
              <div className="space-y-3">
                {filteredReplies.map(reply => {
                  const resolvedPreview = context 
                    ? replaceTemplateVariables(reply.content, context) 
                    : reply.content;

                  return (
                    <div
                      key={reply.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5 group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-xs">{reply.title}</span>
                          {reply.shortcut && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] border border-amber-500/20">
                              {reply.shortcut}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            {reply.category}
                          </span>

                          {/* Action badges if defined */}
                          {reply.actionStage && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium text-[10px] border border-blue-500/30 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              Mueve a: {reply.actionStage}
                            </span>
                          )}
                          {reply.actionTag && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium text-[10px] border border-purple-500/30 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              + {reply.actionTag}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                        <p className="text-slate-200 text-xs whitespace-pre-wrap line-clamp-3 leading-relaxed">
                          {resolvedPreview}
                        </p>
                        {context && resolvedPreview !== reply.content && (
                          <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 pt-1 border-t border-slate-800/50">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Variables personalizadas con datos reales del cliente</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-0.5">
                        <button
                          onClick={() => handleExecuteReply(reply, false)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition"
                        >
                          <Copy className="w-3 h-3 text-slate-400" /> Insertar en chat
                        </button>
                        <button
                          onClick={() => handleExecuteReply(reply, true)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
                        >
                          <Send className="w-3 h-3" /> Enviar ahora
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredReplies.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-slate-400 text-xs">No se encontraron respuestas rápidas.</p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-lg font-semibold"
                    >
                      Crear la primera plantilla
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
