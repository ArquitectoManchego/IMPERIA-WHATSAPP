'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WhatsAppStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async (restart = false) => {
    try {
      const res = await fetch(`/api/whatsapp/status${restart ? '?restart=true' : ''}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (polling) fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [polling]);

  const toggleModal = () => {
    setShowModal(!showModal);
    setPolling(showModal); // Resume polling when closing, pause when opening if needed
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleModal}
        className={`gap-2 rounded-xl transition-all ${
          status?.isReady 
            ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' 
            : 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         status?.isReady ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {status?.isReady ? 'Conectado' : 'Desconectado'}
        </span>
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleModal} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-black text-white tracking-tight">WhatsApp Status</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleModal} className="rounded-xl hover:bg-white/5 text-slate-500">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center gap-6 text-center">
                {status?.isReady ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-emerald-400">¡Conexión Exitosa!</h4>
                      <p className="text-sm text-slate-400 mt-2">
                        El motor de Imperia está vinculado y listo para enviar mensajes.
                      </p>
                    </div>
                  </div>
                ) : status?.qrCodeData ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl shadow-emerald-500/20">
                      <img src={status.qrCodeData} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Escanea el Código QR</h4>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        Abre WhatsApp en tu teléfono {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo.
                      </p>
                    </div>
                  </div>
                ) : status?.lastError ? (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-md font-bold text-red-400">Error en el Motor</h4>
                      <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
                        {status.lastError}
                      </p>
                    </div>
                  </div>
                ) : (status?.isAuthenticated && !status?.isReady) ? (
                  <div className="space-y-4 py-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-md font-bold text-blue-400">¡Autenticado!</h4>
                      <p className="text-sm text-slate-400 mt-2 px-8 leading-relaxed">
                        Sincronizando tus mensajes y preparando el motor...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-8">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                    <p className="text-sm text-slate-400">
                      Iniciando motor de WhatsApp... esto puede tardar un momento.
                    </p>
                    <p className="text-[10px] text-slate-600 px-8 italic">
                      Si tarda demasiado, intenta reiniciar la conexión abajo.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 mt-4 w-full">
                  <Button 
                    onClick={() => { setLoading(true); fetchStatus(true); }}
                    variant="outline"
                    className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 rounded-2xl text-xs font-bold uppercase tracking-widest"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar Conexión
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
