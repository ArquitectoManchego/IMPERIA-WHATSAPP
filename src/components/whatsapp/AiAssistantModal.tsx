'use client';

import React, { useState } from 'react';
import { X, Sparkles, Send, Copy, Globe, Check, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDraft: string;
  onApply: (improvedText: string) => void;
  contactName?: string;
}

export default function AiAssistantModal({
  isOpen,
  onClose,
  currentDraft,
  onApply,
  contactName,
}: AiAssistantModalProps) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState(currentDraft || '');
  const [resultText, setResultText] = useState('');
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<'en' | 'pt'>('en');

  if (!isOpen) return null;

  const handleAction = async (action: 'improve' | 'sales' | 'translate' | 'summarize') => {
    if (!inputText.trim()) {
      toast({ title: 'Ingresa un texto o borrador', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResultText('');
    try {
      const res = await fetch('/api/crm/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: inputText.trim(),
          targetLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar con IA');

      setResultText(data.result || '');
      setProviderName(data.provider || 'Motor IA');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Asistente de Redacción Comercial IA</h3>
              <p className="text-[11px] text-slate-400">
                Optimiza tus respuestas comerciales y atiende a tus clientes con alta conversión
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Input text / draft */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase">
                Texto base o borrador actual
              </label>
              {contactName && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  Cliente: {contactName}
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Escribe una idea básica o el mensaje que quieres mejorar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction('improve')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Mejorar Redacción</span>
            </button>

            <button
              onClick={() => handleAction('sales')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-left"
            >
              <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Respuesta Comercial</span>
            </button>

            <div className="flex gap-1.5 col-span-2">
              <button
                onClick={() => handleAction('translate')}
                disabled={loading}
                className="flex-1 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Traducir a {targetLang === 'en' ? 'Inglés' : 'Portugués'}</span>
              </button>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>
          </div>

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Generando propuesta comercial con IA...</span>
            </div>
          )}

          {/* AI Result Box */}
          {resultText && !loading && (
            <div className="space-y-2 bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Propuesta generada
                </span>
                <span className="text-slate-500 text-[10px]">{providerName}</span>
              </div>
              <p className="text-white text-xs whitespace-pre-wrap leading-relaxed">
                {resultText}
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resultText);
                    toast({ title: 'Copiado al portapapeles' });
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
                <button
                  onClick={() => {
                    onApply(resultText);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-950"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Insertar en chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
