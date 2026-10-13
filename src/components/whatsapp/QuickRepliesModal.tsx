'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Zap, Send, Copy, Trash2, Tag, Search } from 'lucide-react';
import { QuickReply } from '@/lib/crm-domain';
import { useToast } from '@/components/ui/use-toast';

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (text: string, sendImmediately?: boolean) => void;
}

export default function QuickRepliesModal({ isOpen, onClose, onSelect }: QuickRepliesModalProps) {
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
      r.shortcut.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await fetch('/api/crm/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          shortcut: shortcut.trim().startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`,
          content: content.trim(),
          category: category.trim(),
        }),
      });

      if (!res.ok) throw new Error('Error al guardar plantilla');
      toast({ title: 'Respuesta rápida creada' });
      setTitle('');
      setShortcut('');
      setContent('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Biblioteca de Respuestas Rápidas</h3>
              <p className="text-[11px] text-slate-400">Inserta o envía plantillas predefinidas en 1 clic</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Ver lista' : 'Nueva'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="font-semibold text-white text-xs">Crear plantilla reutilizable</h4>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Saludo bienvenida"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[11px] text-slate-400 mb-1">Atajo</label>
                  <input
                    type="text"
                    placeholder="/hola"
                    value={shortcut}
                    onChange={e => setShortcut(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="General, Ventas, Cobranza..."
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Contenido del mensaje</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Texto del mensaje..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
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
                    placeholder="Buscar por título, contenido o atajo..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">Todas</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Templates List */}
              <div className="space-y-2.5">
                {filteredReplies.map(reply => (
                  <div
                    key={reply.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{reply.title}</span>
                        {reply.shortcut && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px]">
                            {reply.shortcut}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{reply.category}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(reply.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-slate-300 text-xs whitespace-pre-wrap line-clamp-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                      {reply.content}
                    </p>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onSelect(reply.content, false);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Insertar en chat
                      </button>
                      <button
                        onClick={() => {
                          onSelect(reply.content, true);
                          onClose();
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-md shadow-emerald-950"
                      >
                        <Send className="w-3 h-3" /> Enviar ahora
                      </button>
                    </div>
                  </div>
                ))}

                {filteredReplies.length === 0 && (
                  <p className="text-slate-500 text-center py-8 text-xs">No se encontraron respuestas rápidas.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
