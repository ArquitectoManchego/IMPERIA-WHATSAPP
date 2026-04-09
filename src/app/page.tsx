'use client';

import React from 'react';
import { MessageSquare, Send, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Profile Header */}
        <div className="bg-[#075e54] p-6 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Imperia WhatsApp</h1>
            <p className="text-xs text-white/70 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Sistema de Mensajería Activo
            </p>
          </div>
        </div>

        {/* Chat Area Skeleton */}
        <div className="flex-1 p-6 space-y-4 min-h-[300px] overflow-y-auto bg-[#e5ddd5] relative">
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] self-start text-sm text-slate-700">
            Bienvenido al portal de WhatsApp Imperia. Seleccione una acción.
          </div>
          
          <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] ml-auto text-sm text-slate-700">
            En espera de comandos de automatización...
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-50 border-t flex flex-col gap-3">
          <div className="flex gap-2">
            <Button className="flex-1 bg-[#25d366] hover:bg-[#128c7e] text-white gap-2 h-12 rounded-xl">
              <MessageCircle className="w-5 h-5" /> Enviar Mensaje
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-xl">
              <Phone className="w-5 h-5 text-slate-600" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 uppercase font-semibold tracking-wider">
            ArquitectoManchego Ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}
