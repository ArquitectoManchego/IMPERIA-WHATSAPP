'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  MapPin, 
  Calendar, 
  StickyNote, 
  Tag as TagIcon,
  Save,
  Loader2,
  Globe,
  User,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContactDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contact: any | null;
  onUpdate: (updatedContact: any) => Promise<void>;
}

export function ContactDetailsSheet({ isOpen, onClose, contact, onUpdate }: ContactDetailsSheetProps) {
  const [loading, setLoading] = useState(false);
  const [editedContact, setEditedContact] = useState<any>(null);

  useEffect(() => {
    if (contact) {
      setEditedContact({ ...contact });
    }
  }, [contact]);

  if (!editedContact) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(editedContact);
      onClose();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Error al guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditedContact((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[120] w-full max-w-lg bg-[#0c0c0e] border-l border-white/10 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/5 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <User className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight leading-none">
                    {editedContact.nombre || 'Sin Nombre'}
                  </h2>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-1 inline-block px-2 py-0.5 rounded-md",
                    editedContact.source === 'google' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {editedContact.source === 'google' ? 'Google Contact' : 'Cliente Taylor'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2 font-black uppercase tracking-widest text-[10px]"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Guardar
                </Button>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Info Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Información Básica
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 ml-1">Nombre Completo</label>
                    <input 
                      value={editedContact.nombre || ''}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl h-11 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 ml-1">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={editedContact.telefono || ''}
                          onChange={(e) => handleChange('telefono', e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={editedContact.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tags Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <TagIcon className="w-3 h-3" /> Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(editedContact.tags || []).map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      {tag}
                      <button onClick={() => handleChange('tags', editedContact.tags.filter((t: string) => t !== tag))}>
                        <X className="w-3 h-3 hover:text-white transition-colors" />
                      </button>
                    </span>
                  ))}
                  <button 
                    onClick={() => {
                      const tag = prompt("Nueva etiqueta:");
                      if (tag) handleChange('tags', [...(editedContact.tags || []), tag]);
                    }}
                    className="px-3 py-1 bg-white/5 border border-dashed border-white/10 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
                  >
                    + Añadir
                  </button>
                </div>
              </section>

              {/* Professional Info Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Información Profesional
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 ml-1">Empresa / Institución</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        value={editedContact.empresa || ''}
                        onChange={(e) => handleChange('empresa', e.target.value)}
                        placeholder="Ej. Imperia Software"
                        className="w-full bg-white/5 border border-white/5 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 ml-1">Cargo / Puesto</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        value={editedContact.cargo || ''}
                        onChange={(e) => handleChange('cargo', e.target.value)}
                        placeholder="Ej. Gerente General"
                        className="w-full bg-white/5 border border-white/5 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Location Info */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Ubicación
                </h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 ml-1">Dirección Completa</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                    <textarea 
                      value={editedContact.direccion || ''}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      placeholder="Calle, Número, Colonia, Ciudad..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/5 rounded-xl pt-4 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Notes Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <StickyNote className="w-3 h-3" /> Notas y Observaciones
                </h3>
                <textarea 
                  value={editedContact.notas || ''}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  placeholder="Información adicional sobre el contacto..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none font-medium leading-relaxed"
                />
              </section>

              {/* Personal Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Fechas Especiales
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 ml-1">Cumpleaños</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="date"
                        value={editedContact.birthday || ''}
                        onChange={(e) => handleChange('birthday', e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-20" /> {/* Spacer */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
