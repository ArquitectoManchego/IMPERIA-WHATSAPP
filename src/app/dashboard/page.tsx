'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Filter, 
  Paperclip, 
  Send, 
  Smile, 
  Phone, 
  Video,
  User,
  Tag,
  Clock,
  CheckCheck,
  Loader2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        setClients(data);
        if (data.length > 0) setSelectedChat(data[0]);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="flex h-full w-full relative z-10">
      {/* 1. Chat List Column */}
      <section className="w-96 border-r border-white/5 flex flex-col glass backdrop-blur-2xl">
        <header className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">Mensajes</h2>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400">
                <Filter className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cargando Clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-sm text-slate-500 font-medium leading-relaxed">No se encontraron clientes que coincidan.</p>
            </div>
          ) : (
            filteredClients.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "group p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 flex gap-4 relative",
                  selectedChat?.id === chat.id 
                    ? "bg-white/5 border border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]" 
                    : "hover:bg-white/[0.02] border border-transparent"
                )}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white truncate text-[15px]">{chat.name || 'Sin Nombre'}</h3>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Activo</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2 leading-relaxed font-medium">
                    {chat.phone || 'Sin número'}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {chat.type && (
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 font-black uppercase tracking-widest leading-none">
                        {chat.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2. Active Chat Column */}
      <section className="flex-1 flex flex-col relative overflow-hidden">
        {selectedChat ? (
          <>
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[160px]" />
            </div>

            <header className="h-24 px-8 border-b border-white/5 flex items-center justify-between glass z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">{selectedChat.name || 'Selecciona un chat'}</h3>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    En Línea
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/5 mx-2" />
                  <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400">
                    <Search className="w-5 h-5" />
                  </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 space-y-8 z-10 scrollbar-hide">
              <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                <MessageSquare className="w-12 h-12 text-slate-500" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Próximamente: Historial de Mensajes Real</p>
              </div>
            </div>

            <footer className="p-8 glass z-10 border-t border-white/5">
              <div className="flex items-center gap-4">
                <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-white">
                  <Smile className="w-6 h-6" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-white">
                  <Paperclip className="w-6 h-6" />
                </Button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje..."
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>
                <Button className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 shrink-0">
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 px-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-emerald-500/40" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tighter mb-2">Selecciona un cliente</h3>
            <p className="text-sm font-medium leading-relaxed">
              Elige a uno de tus clientes registrados en TAYLOR para comenzar la gestión de su pedido.
            </p>
          </div>
        )}
      </section>

      {/* 3. CRM Context Column */}
      <section className="w-80 border-l border-white/5 glass p-8 space-y-10 flex flex-col backdrop-blur-3xl overflow-y-auto">
        {selectedChat ? (
          <>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-6 group relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mb-1 text-center">{selectedChat.name || 'Sin Nombre'}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Cliente Registrado</p>
            </div>

            <div className="space-y-6">
              <header className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atributos CRM</h4>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase">
                  {selectedChat.status || 'Active'}
                </div>
              </header>
              
              <div className="grid grid-cols-1 gap-3">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Tag className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Detalles</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{selectedChat.phone}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      Sincronizado desde base de datos compartida.
                    </p>
                 </div>
              </div>
            </div>

            <div className="mt-auto pt-10">
               <Button className="w-full h-14 bg-transparent hover:bg-white/5 text-white/50 hover:text-white border border-white/5 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Ajustes del Chat
               </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
             <Clock className="w-8 h-8 mb-4" />
             <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
               Esperando Selección de Cliente
             </p>
          </div>
        )}
      </section>
    </div>
  );
}
