'use client';

import React, { useState } from 'react';
import { 
  X, 
  Tag as TagIcon, 
  Plus, 
  Trash2, 
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  contacts: any[]; // All contacts to get current data
  onSuccess: () => void;
}

const PRESET_TAGS = [
  "Imperia",
  "Alumnos",
  "Enfermería",
  "VIP",
  "Prioridad",
  "Escuela"
];

export function BulkEditModal({ isOpen, onClose, selectedIds, contacts, onSuccess }: BulkEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

  const handleAddPresetTag = (tag: string) => {
    if (!tagsToAdd.includes(tag)) {
      setTagsToAdd([...tagsToAdd, tag]);
      setTagsToRemove(tagsToRemove.filter(t => t !== tag));
    }
  };

  const handleRemovePresetTag = (tag: string) => {
    if (!tagsToRemove.includes(tag)) {
      setTagsToRemove([...tagsToRemove, tag]);
      setTagsToAdd(tagsToAdd.filter(t => t !== tag));
    }
  };

  const handleAddNewTag = () => {
    if (newTag && !tagsToAdd.includes(newTag)) {
      setTagsToAdd([...tagsToAdd, newTag]);
      setNewTag('');
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-edit',
          selectedContacts,
          tagsToAdd,
          tagsToRemove
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el servidor');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Bulk edit error:", error);
      alert(`Error en edición masiva: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Edición Masiva</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Modificando {selectedIds.size} contactos seleccionados</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Add Tags Section */}
          <section>
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus className="w-3 h-3" /> Añadir Etiquetas
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAddPresetTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    tagsToAdd.includes(tag) 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nueva etiqueta..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                className="flex-1 h-10 bg-white/5 border border-white/5 rounded-xl px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
              <Button onClick={handleAddNewTag} size="sm" className="bg-white/10 text-white hover:bg-emerald-500">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </section>

          {/* Remove Tags Section */}
          <section>
            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trash2 className="w-3 h-3" /> Quitar Etiquetas
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsToRemove.length === 0 ? (
                <p className="text-[10px] text-slate-700 italic">Ninguna seleccionada para quitar</p>
              ) : (
                tagsToRemove.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTagsToRemove(tagsToRemove.filter(t => t !== tag))}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"
                  >
                    {tag} <X className="w-3 h-3" />
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Summary/Warning */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3">
             <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">
               Los contactos seleccionados de Google serán importados automáticamente a Taylor si se les añade una etiqueta.
             </p>
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] flex gap-3">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="flex-1 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={loading || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Aplicar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
