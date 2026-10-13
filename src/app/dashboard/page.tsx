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
  Image as ImageIcon,
  Download,
  FileDown,
  Zap,
  Calendar,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { WhatsAppStatus } from '@/components/whatsapp/WhatsAppStatus';
import CrmPanel from '@/components/CrmPanel';
import QuickRepliesModal from '@/components/whatsapp/QuickRepliesModal';
import AiAssistantModal from '@/components/whatsapp/AiAssistantModal';

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
  const [showMobileCrm, setShowMobileCrm] = useState(false);



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
  const sendingRef = React.useRef(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageLimit, setMessageLimit] = useState(200);
  const [daysToLoad, setDaysToLoad] = useState(2);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncedPhones, setSyncedPhones] = useState<Set<string>>(new Set());
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Bulk sync state
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ progress: number; total: number; currentChat: string }>({ progress: 0, total: 0, currentChat: '' });
  const [syncCompletedStats, setSyncCompletedStats] = useState<{ totalContacts: number; totalMessages: number } | null>(null);

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
      }, 5000);

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
  const fetchMessages = async (isPoll = false) => {
    if (!selectedChat) return;
    
    if (!syncedPhones.has(selectedChat.id)) {
      setMessages([]);
      return;
    }
    
    try {
      if (!isPoll) setLoadingMessages(true);
      const res = await fetch(`/api/whatsapp/messages?chatId=${encodeURIComponent(selectedChat.id)}&limit=${messageLimit}&days=${daysToLoad}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        // Only update if message count changed or first load
        if (data.length !== messages.length || !isPoll) {
           setMessages(data);
        }
      } 
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isPoll) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up polling for new messages every 5 seconds
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [selectedChat, messageLimit, daysToLoad, syncedPhones]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingMessages(false); // Reset this
        setLoading(true);
        
        // 1. Fetch Recent Chats from WhatsApp (up to 200)
        const resChats = await fetch('/api/whatsapp/chats?limit=200');
        const chatsData = await resChats.json();
        
        const formattedChats = Array.isArray(chatsData) ? chatsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || c.id.split('@')[0],
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
        // Automatically allow reading loaded chats
        setSyncedPhones(new Set(formattedChats.map((c: any) => c.id)));
        
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
    setSyncedPhones(prev => new Set(prev).add(chat.id));
  };

  const handleStartBulkSync = async () => {
    setIsSyncingHistory(true);
    setSyncCompletedStats(null);
    setSyncProgress({ progress: 0, total: 0, currentChat: 'Iniciando escaneo...' });

    const progressPoll = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/sync-history');
        const data = await res.json();
        if (data && typeof data.progress === 'number') {
          setSyncProgress({ progress: data.progress, total: data.total || 0, currentChat: data.currentChat || '' });
          if (!data.inProgress && data.total > 0) {
            clearInterval(progressPoll);
          }
        }
      } catch {}
    }, 1000);

    try {
      const res = await fetch('/api/whatsapp/sync-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: 2, minMessages: 50 })
      });
      const result = await res.json();
      clearInterval(progressPoll);

      if (result.success) {
        setSyncCompletedStats({
          totalContacts: result.totalContacts,
          totalMessages: result.totalMessages
        });
        toast({
          title: "Sincronización Completada",
          description: `Se descargaron ${result.totalMessages} mensajes de ${result.totalContacts} contactos de los últimos 2 meses.`
        });
        
        // Refresh chat list
        const resChats = await fetch('/api/whatsapp/chats?limit=200');
        const freshChats = await resChats.json();
        if (Array.isArray(freshChats)) {
          const formatted = freshChats.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || c.id.split('@')[0],
            status: 'Reciente',
            type: 'WhatsApp'
          }));
          setClients(formatted);
          setSyncedPhones(new Set(formatted.map(c => c.id)));
        }

        if (selectedChat) {
          fetchMessages();
        }
      } else {
        throw new Error(result.error || 'Error en sincronización');
      }
    } catch (err: any) {
      clearInterval(progressPoll);
      toast({
        title: "Error en Descarga de Historial",
        description: err.message || "No se pudo completar la sincronización",
        variant: "destructive"
      });
    } finally {
      setIsSyncingHistory(false);
    }
  };

  const handleExportHistory = () => {
    window.open('/api/whatsapp/sync-history?export=true', '_blank');
  };

  const handleSendMessage = async () => {
    if (sendingRef.current || sending || !selectedChat) return;
    const textToSend = messageText.trim();
    const mediaToSend = attachment;
    if (!textToSend && !mediaToSend) return;

    sendingRef.current = true;
    setSending(true);

    // Immediately clear input fields so user cannot double-submit
    setMessageText('');
    setAttachment(null);

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      body: textToSend,
      mediaUrl: mediaToSend || undefined,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      hasMedia: !!mediaToSend,
      type: mediaToSend ? 'image' : 'chat'
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const targetId = (selectedChat.id && selectedChat.id.includes('@'))
        ? selectedChat.id
        : (selectedChat.phone || selectedChat.id);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetId,
          phone: selectedChat.phone,
          message: textToSend,
          mediaBase64: mediaToSend
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: mediaToSend ? "Imagen Enviada" : "Mensaje Enviado",
          description: `Enviado a ${selectedChat.name || selectedChat.phone || targetId}`,
        });
        
        // Update optimistic message with real ID
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: result.messageId || m.id } : m));
        // Immediately fetch fresh messages
        setTimeout(() => fetchMessages(true), 500);
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (err: any) {
      toast({
        title: "Error de Envío",
        description: err.message || "No se pudo enviar el mensaje.",
        variant: "destructive"
      });
      // Rollback optimistic message if send failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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
      <section className={cn(
        "w-full md:w-96 border-r border-white/5 flex flex-col glass backdrop-blur-2xl shrink-0 transition-all",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <header className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Mensajes</h2>
              <WhatsAppStatus />
            </div>            <div className="flex gap-1.5 items-center">
              <Button 
                size="sm"
                variant="outline"
                title="Descargar historial de los últimos 2 meses (50 mensajes por contacto)"
                onClick={handleStartBulkSync}
                disabled={isSyncingHistory}
                className="gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold rounded-xl h-9 px-2.5"
              >
                {isSyncingHistory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{syncProgress.progress}/{syncProgress.total || '...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar 2m</span>
                  </>
                )}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                title="Exportar Historial Completo a JSON"
                onClick={handleExportHistory}
                className="rounded-xl hover:bg-white/5 text-slate-400 h-9 w-9"
              >
                <FileDown className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setShowDebug(!showDebug)}
                className={cn("rounded-xl transition-all h-9 w-9", showDebug ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-white/5 text-slate-400")}
              >
                <Sparkles className="w-4 h-4" />
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

          {/* Progress Bar for Bulk Sync */}
          {isSyncingHistory && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400">
                <span className="truncate max-w-[200px]">Descargando: {syncProgress.currentChat || 'Iniciando...'}</span>
                <span>{syncProgress.total ? Math.round((syncProgress.progress / syncProgress.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${syncProgress.total ? (syncProgress.progress / syncProgress.total) * 100 : 5}%` }}
                />
              </div>
            </div>
          )}

          {/* Sync Completed Notification Badge */}
          {syncCompletedStats && !isSyncingHistory && (
            <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-[11px] text-emerald-400">
              <span className="font-semibold">
                ✅ {syncCompletedStats.totalContacts} contactos ({syncCompletedStats.totalMessages} msgs)
              </span>
              <button 
                onClick={() => setSyncCompletedStats(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
                    <h3 className="font-bold text-white truncate text-sm blur-sensitive">{chat.name || 'Sin Nombre'}</h3>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">{chat.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate leading-tight font-medium blur-sensitive">
                    {chat.phone}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2. Active Chat Column */}
      <section className={cn(
        "flex-1 flex flex-col relative overflow-hidden",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[160px]" />
            </div>

            <header className="h-20 md:h-24 px-4 sm:px-8 border-b border-white/5 flex items-center justify-between glass z-10 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Back button on mobile */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setSelectedChat(null)} 
                  className="md:hidden rounded-xl text-slate-400 hover:text-white shrink-0 -ml-2 h-9 w-9"
                  title="Volver a la lista de chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                  {selectedChat.avatar ? (
                    <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white tracking-tight blur-sensitive truncate">{selectedChat.name || 'Selecciona un chat'}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest blur-sensitive">
                      ID: {selectedChat.id}
                    </p>
                    {selectedChat.id.includes('@g.us') && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded border border-amber-500/20">GRUPO</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                  {/* CRM Drawer toggle on mobile/tablet */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setShowMobileCrm(!showMobileCrm)}
                    title="Ver ficha y atributos CRM"
                    className="xl:hidden rounded-xl hover:bg-white/5 text-slate-400 hover:text-emerald-400 h-9 w-9"
                  >
                    <UserCheck className="w-5 h-5" />
                  </Button>
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Cita con ${selectedChat.name || selectedChat.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Agendar en Google Calendar"
                    className="hidden sm:inline-flex"
                  >
                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400 hover:text-emerald-400">
                      <Calendar className="w-5 h-5" />
                    </Button>
                  </a>
                  <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400 hidden sm:inline-flex">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5 text-slate-400 hidden sm:inline-flex">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/5 mx-1 hidden sm:block" />
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
                            {msg.mediaUrl ? (
                              <div className="mb-2 rounded-xl overflow-hidden max-h-60 border border-white/10 shadow-md">
                                <img src={msg.mediaUrl} alt="Adjunto" className="w-full h-full object-cover" />
                              </div>
                            ) : msg.hasMedia && msg.type === 'image' && !msg.body ? (
                              <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
                                <ImageIcon className="w-4 h-4" />
                                <span>Imagen</span>
                              </div>
                            ) : null}
                            {msg.body && <div className="blur-sensitive whitespace-pre-wrap">{msg.body}</div>}
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

            <footer className="p-3 sm:p-6 md:p-8 glass z-10 border-t border-white/5 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*,application/pdf"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-1.5 sm:gap-4">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsQuickRepliesOpen(true)}
                  title="Respuestas Rápidas (Plantillas)"
                  className="rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-10 w-10 sm:h-12 sm:w-12 shrink-0"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsAiAssistantOpen(true)}
                  title="Asistente de Redacción Comercial IA"
                  className="rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-10 w-10 sm:h-12 sm:w-12 shrink-0"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Adjuntar imagen o archivo"
                  className="rounded-xl text-slate-400 hover:text-white h-10 w-10 sm:h-12 sm:w-12 shrink-0"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="flex-1 relative flex flex-col gap-2 min-w-0">
                  {attachment && (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-emerald-500/30 group mb-1 shadow-2xl shrink-0">
                      <img src={attachment} alt="Adjunto" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setAttachment(null)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 transition-opacity"
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
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        if (messageText.trim() || attachment) {
                          handleSendMessage(); 
                        }
                      } 
                    }}
                    onPaste={handlePaste}
                    className="w-full h-11 sm:h-14 bg-white/5 border border-white/5 rounded-2xl px-3 sm:px-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={sending || (!messageText.trim() && !attachment)}
                  className="w-11 h-11 sm:w-14 sm:h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Send className="w-5 h-5 sm:w-6 sm:h-6" />}
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

      {/* 3. CRM Context Column - Desktop */}
      <section className="hidden xl:flex w-80 border-l border-white/5 glass flex-col backdrop-blur-3xl overflow-y-auto shrink-0">
        {selectedChat ? (
          <div className="p-4 flex flex-col h-full">
            <div className="flex flex-col items-center pb-4 border-b border-white/5 mb-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-3 group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                {selectedChat.avatar ? (
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="text-base font-black text-white tracking-tight mb-0.5 text-center">{selectedChat.name || 'Sin Nombre'}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{selectedChat.phone || selectedChat.id}</p>
            </div>

            <CrmPanel phone={selectedChat.phone || selectedChat.id} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-8">
             <Clock className="w-8 h-8 mb-4" />
             <p className="text-[9px] font-black uppercase tracking-widest leading-loose">
               Esperando Selección de Cliente
             </p>
          </div>
        )}
      </section>

      {/* Mobile CRM Slide-over Drawer */}
      {showMobileCrm && selectedChat && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileCrm(false)} />
          <div className="relative ml-auto w-full max-w-sm h-full bg-slate-950/95 border-l border-white/10 shadow-2xl flex flex-col overflow-y-auto p-4 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
              <span className="text-sm font-bold text-white">Atributos CRM</span>
              <Button size="icon" variant="ghost" onClick={() => setShowMobileCrm(false)} className="rounded-xl h-8 w-8 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center pb-4 border-b border-white/5 mb-4 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-2 overflow-hidden">
                {selectedChat.avatar ? (
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <h3 className="text-sm font-black text-white text-center">{selectedChat.name || 'Sin Nombre'}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedChat.phone || selectedChat.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CrmPanel phone={selectedChat.phone || selectedChat.id} />
            </div>
          </div>
        </div>
      )}

      {/* 4. Debug Window */}
      {showDebug && (
        <div 
          className="fixed bottom-8 right-8 w-[450px] min-h-[400px] h-[750px] bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ resize: 'both' }}
        >
          <header className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Monitor de Motor WhatsApp</span>
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

      {/* Quick Replies & AI Assistant Modals */}
      <QuickRepliesModal
        isOpen={isQuickRepliesOpen}
        onClose={() => setIsQuickRepliesOpen(false)}
        onSelect={(text, sendImmediately) => {
          if (sendImmediately) {
            setMessageText(text);
            setTimeout(() => handleSendMessage(), 50);
          } else {
            setMessageText(prev => prev ? `${prev} ${text}` : text);
          }
        }}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentDraft={messageText}
        contactName={selectedChat?.name}
        onApply={(improved) => setMessageText(improved)}
      />
    </div>
  );
}
