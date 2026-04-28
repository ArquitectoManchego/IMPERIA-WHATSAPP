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
  Sparkles,
  RefreshCw,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { WhatsAppStatus } from '@/components/whatsapp/WhatsAppStatus';

export default function DashboardPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  
  const [clients, setClients] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);



  const filteredClients = React.useMemo(() => {
    const search = searchTerm.toLowerCase();
    if (!search) return clients;

    // Filter active chats
    const activeMatches = clients.filter(c => 
      (c.name || '').toLowerCase().includes(search) ||
      (c.phone || '').includes(search)
    );

    // Filter global contacts that aren't in active chats
    const globalMatches = allContacts
      .filter(c => 
        !clients.some(ac => ac.phone === c.telefono) && 
        ((c.nombre || '').toLowerCase().includes(search) || (c.telefono || '').includes(search))
      )
      .map(c => ({
        id: c.id,
        name: c.nombre,
        phone: c.telefono,
        status: 'Disponible',
        type: c.source === 'google' ? 'Google' : 'Taylor',
        isGlobal: true
      }));

    return [...activeMatches, ...globalMatches];
  }, [searchTerm, clients, allContacts]);

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageLimit, setMessageLimit] = useState(200);
  const [daysToLoad, setDaysToLoad] = useState(2);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncedPhones, setSyncedPhones] = useState<Set<string>>(new Set());
  const [attachment, setAttachment] = useState<string | null>(null);

  // Debug Logs State
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Poll for logs
  useEffect(() => {
    let interval: any;
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/whatsapp/logs');
        const data = await res.json();
        if (Array.isArray(data)) setSystemLogs(data);
      } catch (e) {}
    };

    const fetchScreenshot = async () => {
      if (!showDebug) return;
      try {
        const res = await fetch('/api/whatsapp/screenshot');
        const data = await res.json();
        if (data.screenshot) setScreenshot(data.screenshot);
      } catch (e) {}
    };

    if (showDebug || loadingMessages || loading) {
      fetchLogs();
      if (showDebug) fetchScreenshot();
      
      interval = setInterval(() => {
        fetchLogs();
      }, 3000);

      // Separate slow interval for screenshots
      const screenshotInterval = setInterval(() => {
        if (showDebug) fetchScreenshot();
      }, 60000);

      return () => {
        clearInterval(interval);
        clearInterval(screenshotInterval);
      };
    }
  }, [showDebug, loadingMessages, loading]);

  // Fetch messages when chat is selected and synced
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      
      if (!syncedPhones.has(selectedChat.id)) {
        setMessages([]);
        return;
      }
      
      try {
        console.log(`[Dashboard] Requesting messages for: ${selectedChat.id} (Name: ${selectedChat.name})`);
        setLoadingMessages(true);
        const res = await fetch(`/api/whatsapp/messages?chatId=${encodeURIComponent(selectedChat.id)}&limit=${messageLimit}&days=${daysToLoad}`);
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          setMessages(data);
        } else {
          toast({
            title: "Error al sincronizar",
            description: data.error || "No se pudieron obtener los mensajes.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChat, messageLimit, daysToLoad, syncedPhones]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingMessages(false); // Reset this
        setLoading(true);
        
        // 1. Fetch 20 Most Recent Chats from WhatsApp
        const resChats = await fetch('/api/whatsapp/chats');
        const chatsData = await resChats.json();
        
        const formattedChats = Array.isArray(chatsData) ? chatsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.id.split('@')[0],
          status: 'Reciente',
          type: 'WhatsApp'
        })) : [];

        // 2. Fetch Taylor + Google for global search
        let globalData: any[] = [];
        try {
          const resGlobal = await fetch('/api/sync/contacts');
          const gData = await resGlobal.json();
          if (Array.isArray(gData)) {
            globalData = gData;
          }
        } catch (e) {
          console.error("Global search fetch failed:", e);
        }

        // 3. Fallback: If globalData is empty, fetch Taylor directly
        if (globalData.length === 0) {
          const { db } = await import('@/lib/firebase');
          const { collection, getDocs, query } = await import('firebase/firestore');
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
          const clientsPath = `artifacts/${projectId}/public/data/clients`;
          const snapshot = await getDocs(query(collection(db, clientsPath)));
          globalData = snapshot.docs.map(doc => ({
            id: doc.id,
            nombre: doc.data().nombre,
            telefono: doc.data().telefono,
            source: 'taylor'
          }));
        }

        setAllContacts(globalData);

        const clean = (p: string) => (p || '').replace(/\D/g, '');
        const targetPhone = clean(phoneParam || '');
        
        let matched = targetPhone ? formattedChats.find((c: any) => clean(c.phone) === targetPhone) : null;
        
        if (phoneParam && !matched) {
          const globalMatch = globalData.find((c: any) => clean(c.telefono) === targetPhone);
          if (globalMatch) {
            matched = {
              id: globalMatch.id,
              name: globalMatch.nombre,
              phone: globalMatch.telefono,
              status: 'Disponible',
              type: globalMatch.source === 'google' ? 'Google' : 'Taylor'
            };
            formattedChats.unshift(matched);
          }
        }

        setClients(formattedChats);
        
        if (!hasInitialized) {
          if (matched) {
            setSelectedChat(matched);
            setSyncedPhones(prev => new Set(prev).add(matched.id));
          } else if (formattedChats.length > 0 && !phoneParam) {
            setSelectedChat(formattedChats[0]);
          }
          setHasInitialized(true);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [phoneParam, hasInitialized]);

  const toggleSync = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setSyncedPhones(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const handleChatSelect = (chat: any) => {
    console.log(`[UI] Selecting Chat: ${chat.name} (${chat.id})`);
    setSelectedChat(chat);
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!messageText.trim() && !attachment) || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: messageText,
          mediaBase64: attachment
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: attachment ? "Imagen Enviada" : "Mensaje Enviado",
          description: `Enviado a ${selectedChat.name || selectedChat.phone}`,
        });
        
        // Optimistic update
        const newMessage = {
          id: result.messageId,
          body: messageText,
          fromMe: true,
          timestamp: Math.floor(Date.now() / 1000),
          hasMedia: !!attachment
        };
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        setAttachment(null);
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (err: any) {
      toast({
        title: "Error de Envío",
        description: err.message || "No se pudo enviar el mensaje.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachment(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const filteredMessages = messages; // Already filtered by server now

  return (
    <div className="flex h-full w-full relative z-10">
      {/* 1. Chat List Column */}
      <section className="w-96 border-r border-white/5 flex flex-col glass backdrop-blur-2xl">
        <header className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-white tracking-tight">Mensajes</h2>
              <WhatsAppStatus />
            </div>            <div className="flex gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setShowDebug(!showDebug)}
                className={cn("rounded-xl transition-all", showDebug ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-white/5 text-slate-400")}
              >
                <Sparkles className="w-5 h-5" />
              </Button>
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
                onClick={() => handleChatSelect(chat)}
                className={cn(
                  "group p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 flex gap-4 relative items-center",
                  selectedChat?.id === chat.id 
                    ? "bg-white/5 border border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]" 
                    : "hover:bg-white/[0.02] border border-transparent"
                )}
              >
                {/* Sync Checkbox */}
                <div 
                  onClick={(e) => toggleSync(e, chat.id)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                    syncedPhones.has(chat.id) 
                      ? "bg-emerald-500 border-emerald-500" 
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  {syncedPhones.has(chat.id) && <CheckCheck className="w-3 h-3 text-white" />}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-white truncate text-sm">{chat.name || 'Sin Nombre'}</h3>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">{chat.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate leading-tight font-medium">
                    {chat.phone}
                  </p>
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
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                  {selectedChat.avatar ? (
                    <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">{selectedChat.name || 'Selecciona un chat'}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      ID: {selectedChat.id}
                    </p>
                    {selectedChat.id.includes('@g.us') && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded border border-amber-500/20">GRUPO</span>
                    )}
                  </div>
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

            <div className="flex-1 overflow-y-auto p-8 space-y-4 z-10 custom-scrollbar flex flex-col">
              {!syncedPhones.has(selectedChat.id) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <RefreshCw className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h4 className="text-lg font-bold text-white tracking-tight">Chat no sincronizado</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      Activa el checkbox junto al nombre del cliente para cargar su historial de mensajes.
                    </p>
                    <Button 
                      onClick={() => setSyncedPhones(prev => new Set(prev).add(selectedChat.id))}
                      className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl"
                    >
                      Sincronizar ahora
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Load More Control */}
                  <div className="flex items-center justify-center gap-3 py-4 border-b border-white/5 mb-4 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cargar:</span>
                    <input 
                      type="number" 
                      value={daysToLoad} 
                      onChange={(e) => setDaysToLoad(parseInt(e.target.value) || 0)}
                      className="w-12 h-8 bg-white/5 border border-white/10 rounded-lg text-center text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">días</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setMessageLimit(prev => prev + 100)}
                      className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Cargar más Historial
                    </Button>
                  </div>

                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Consultando WhatsApp...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                      <MessageSquare className="w-12 h-12 text-slate-500" />
                      <p className="text-xs font-bold uppercase tracking-widest">Sin mensajes en los últimos {daysToLoad} {daysToLoad === 1 ? 'día' : 'días'}</p>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="link" 
                          onClick={() => setDaysToLoad(prev => prev + 5)}
                          className="text-emerald-500 text-[10px] font-black uppercase"
                        >
                          Cargar 5 días anteriores
                        </Button>
                        <Button 
                          variant="link" 
                          onClick={() => setDaysToLoad(0)}
                          className="text-emerald-500 text-[10px] font-black uppercase"
                        >
                          Ver todo el historial disponible
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-10">
                      {filteredMessages.map((msg, idx) => (
                        <div 
                          key={msg.id || idx} 
                          className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-xl ${
                            msg.fromMe 
                              ? 'bg-emerald-500 text-white rounded-tr-none shadow-emerald-900/20' 
                              : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none shadow-black/20'
                          }`}>
                            {msg.body}
                            <div className={`text-[9px] mt-2 opacity-50 ${msg.fromMe ? 'text-right' : 'text-left'} font-bold`}>
                               {msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <footer className="p-8 glass z-10 border-t border-white/5">
              <div className="flex items-center gap-4">
                <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-white">
                  <Smile className="w-6 h-6" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-white">
                  <Paperclip className="w-6 h-6" />
                </Button>
                <div className="flex-1 relative flex flex-col gap-2">
                  {attachment && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-500/30 group mb-2 shadow-2xl">
                      <img src={attachment} alt="Adjunto" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setAttachment(null)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder={attachment ? "Añadir un comentario..." : "Escribe un mensaje..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    onPaste={handlePaste}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 shrink-0"
                >
                  {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
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
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-6 group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                {selectedChat.avatar ? (
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
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

      {/* 4. Debug Window */}
      {showDebug && (
        <div 
          className="fixed bottom-8 right-8 w-[450px] min-h-[400px] h-[750px] bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ resize: 'both' }}
        >
          <header className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Monitor de Sistema</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  await fetch('/api/whatsapp/logs', { method: 'DELETE' });
                  setSystemLogs([]);
                }}
                className="text-[9px] font-black uppercase text-slate-500 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-all"
              >
                Limpiar
              </button>
              <button onClick={() => setShowDebug(false)} className="text-slate-500 hover:text-white transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Logs Area */}
            <div className="flex-[2] p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 bg-black/40">
              {systemLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  Esperando eventos del sistema...
                </div>
              ) : (
                systemLogs.map((log, i) => {
                  const isError = log.includes('❌') || log.includes('Error') || log.includes('Failed');
                  const isSuccess = log.includes('✅') || log.includes('Success');
                  const isInfo = log.includes('🔹');
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "py-0.5 border-l-2 pl-2 transition-colors",
                        isError ? "text-rose-400 border-rose-500 bg-rose-500/5" : 
                        isSuccess ? "text-emerald-400 border-emerald-500 bg-emerald-500/5" :
                        isInfo ? "text-sky-400 border-sky-500 bg-sky-500/5" :
                        "text-slate-400 border-slate-700"
                      )}
                    >
                      <span className="opacity-50 mr-2 text-[8px]">
                        [{new Date().toLocaleTimeString()}]
                      </span>
                      {log}
                    </div>
                  );
                })
              )}
              <div id="logs-end" />
            </div>

            {/* Browser Preview Area */}
            {screenshot && (
              <div className="flex-[3] p-4 border-t border-white/10 bg-black/60 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Navegador Interno (Vista Móvil)</p>
                  <button 
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;"><img src="${screenshot}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`);
                        newWindow.document.close();
                      }
                    }}
                    className="text-[8px] font-black text-emerald-500 hover:text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 transition-all"
                  >
                    Pantalla Completa
                  </button>
                </div>
                <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-slate-900 group shadow-inner">
                  <img src={screenshot} alt="WA Web Screenshot" className="w-full h-full object-contain" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
