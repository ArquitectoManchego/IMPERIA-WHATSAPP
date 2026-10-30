'use client';

import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Send, 
  Sparkles, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  AVAILABLE_TEMPLATE_VARIABLES, 
  replaceTemplateVariables, 
  VariableContext 
} from '@/lib/template-variables';

export interface ScheduledMessage {
  id: string;
  chatId: string;
  phone: string;
  contactName: string;
  message: string;
  scheduledTime: string; // ISO string
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  phone: string;
  contactName: string;
  context?: VariableContext;
  onSchedule: (scheduled: ScheduledMessage) => void;
}

export default function ScheduleMessageModal({
  isOpen,
  onClose,
  chatId,
  phone,
  contactName,
  context,
  onSchedule
}: ScheduleMessageModalProps) {
  // Default to 1 hour from now
  const getDefaultTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [scheduledDateTime, setScheduledDateTime] = useState(getDefaultTime());
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const insertVariable = (tag: string) => {
    setMessage(prev => `${prev} ${tag} `.replace(/\s+/g, ' '));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !scheduledDateTime) return;

    const resolvedMessage = context 
      ? replaceTemplateVariables(message.trim(), context)
      : message.trim();

    const scheduledItem: ScheduledMessage = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      chatId,
      phone,
      contactName,
      message: resolvedMessage,
      scheduledTime: new Date(scheduledDateTime).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onSchedule(scheduledItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Programar Envío de Mensaje</h3>
              <p className="text-[11px] text-slate-400">
                Para: <strong className="text-white">{contactName || phone}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Fecha y hora de envío</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDateTime}
              onChange={e => setScheduledDateTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Mensaje a programar</label>
              <span className="text-[10px] text-slate-500">Variables dinámicas admitidas</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {AVAILABLE_TEMPLATE_VARIABLES.slice(0, 5).map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700/80 rounded text-[10px] font-mono flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{v.tag}</span>
                </button>
              ))}
            </div>

            <textarea
              required
              rows={4}
              placeholder="Hola {primer_nombre}, le recordamos que sus uniformes están listos para recolección..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2 text-slate-300 text-[11px]">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              El sistema enviará automáticamente este mensaje a la hora indicada a través de la conexión activa de WhatsApp.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-950 flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Programar Mensaje</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
