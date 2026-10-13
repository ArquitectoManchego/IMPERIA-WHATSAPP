'use client';

import React, { useState } from 'react';
import { X, Send, User, Phone, MessageSquare, Calendar } from 'lucide-react';
import { useCrmUi } from '@/context/CrmUiContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function NewChatModal() {
  const { isNewChatModalOpen, setIsNewChatModalOpen, t } = useCrmUi();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [initialMsg, setInitialMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!isNewChatModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({
        title: 'Teléfono inválido',
        description: 'Ingresa un número a 10 dígitos (ej. 2291234567) o con código de país.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Normalize to WhatsApp ID
      let digits = cleanPhone.replace(/^\+/, '');
      if (digits.length === 10 && !digits.startsWith('52')) {
        digits = '521' + digits;
      }
      const chatId = `${digits}@c.us`;

      // Save initial contact in CRM if name provided
      if (name.trim()) {
        await fetch('/api/crm/context', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: digits, nombre: name.trim() }),
        });
      }

      // If initial message provided, send it
      if (initialMsg.trim()) {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            message: initialMsg.trim(),
            requestId: crypto.randomUUID(),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al enviar mensaje');
        }
      }

      toast({
        title: 'Conversación lista',
        description: `Abriendo chat con ${name || digits}...`,
      });

      setIsNewChatModalOpen(false);
      setPhone('');
      setName('');
      setInitialMsg('');
      router.push(`/dashboard?phone=${encodeURIComponent(digits)}`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              +
            </div>
            <h3 className="font-semibold text-white text-base">Iniciar chat con número nuevo</h3>
          </div>
          <button 
            onClick={() => setIsNewChatModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Teléfono WhatsApp *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="tel"
                required
                placeholder="229 123 4567 o +52 1..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">No necesitas guardar el número en tu agenda telefónica.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre del contacto (opcional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Primer mensaje (opcional)
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <textarea
                placeholder="¡Hola! Te contacto de IMPERIA..."
                value={initialMsg}
                onChange={(e) => setInitialMsg(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
            >
              {loading ? (
                <span>Abriendo...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Iniciar Chat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
