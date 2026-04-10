'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, MessageSquare, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WhatsAppStatus = {
  isReady: boolean;
  qrCodeData: string | null;
  isInitializing: boolean;
  lastError: string | null;
};

export default function WhatsAppConnector() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    qrCodeData: null,
    isInitializing: false,
    lastError: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const fetchStatus = async (isRestart = false) => {
    if (isRestart) setIsRestarting(true);
    try {
      const url = isRestart ? '/api/whatsapp/status?restart=true' : '/api/whatsapp/status';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('No se pudo sincronizar con el servidor de WhatsApp');
      console.error(err);
    } finally {
      if (isRestart) setIsRestarting(false);
      setLoading(false);
    }
  };

  const handleRestart = () => {
    fetchStatus(true);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (!status.isReady) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status.isReady]);

  const showLoader = loading || status.isInitializing || isRestarting;

  return (
    <Card className="w-full max-w-lg mx-auto glass border-white/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] overflow-hidden rounded-[2.5rem]">
      <CardHeader className="relative overflow-hidden pt-12 pb-10 px-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-white mb-1">
                Conectividad <span className="text-emerald-500">WA</span>
              </CardTitle>
              <div className="h-1 w-12 bg-emerald-500 rounded-full" />
            </div>
          </div>
          <CardDescription className="text-slate-400 text-base font-medium max-w-[80%] leading-relaxed">
            {status.isReady 
              ? 'Enlace biométrico activo. El motor CRM está listo para procesar solicitudes.' 
              : 'Sincroniza tu canal de comunicación para desbloquear el dashboard administrativo.'}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-10 flex flex-col items-center relative">
        {status.isReady ? (
          <div className="text-center w-full">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Enlace Establecido</h3>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
              Escucha activa habilitada para el ecosistema <span className="text-white font-bold">Imperia</span>.
            </p>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full h-16 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 rounded-3xl font-black text-lg tracking-widest uppercase shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border-none">
                Entrar al Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {status.qrCodeData && !isRestarting ? (
              <div className="flex flex-col items-center">
                <div className="p-6 bg-white rounded-[2rem] shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)] mb-10 transform hover:scale-[1.02] transition-transform duration-700">
                  <img src={status.qrCodeData} alt="WhatsApp QR Code" className="w-64 h-64 grayscale-[0.2]" />
                </div>
                <div className="space-y-4 text-center">
                  <p className="text-emerald-500 font-bold text-sm tracking-widest uppercase mb-4">Instrucciones de Vinculación</p>
                  <p className="text-slate-400 text-sm leading-8 font-medium">
                    1. Abre <span className="text-white">WhatsApp</span> en tu dispositivo <br/>
                    2. Dirígete a <span className="text-white">Dispositivos Vinculados</span> en ajustes <br/>
                    3. Pulsa <span className="text-white font-bold">"Vincular un dispositivo"</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center gap-6">
                <div className="relative">
                  <QrCode className="w-24 h-24 text-slate-800 animate-pulse" />
                  <Loader2 className="absolute inset-0 w-24 h-24 text-emerald-500/20 animate-spin" />
                </div>
                <p className="text-slate-500 text-sm font-black tracking-widest uppercase">
                  {isRestarting ? 'Reiniciando motor...' : 'Generando Enlace...'}
                </p>
              </div>
            )}
            
            {(error || status.lastError) && (
              <div className="mt-10 flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3 text-red-100 bg-red-500/10 p-5 rounded-2xl border border-red-500/20 w-full text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <p className="text-slate-300">{error || status.lastError}</p>
                </div>
                <Button 
                  onClick={handleRestart}
                  disabled={isRestarting}
                  variant="outline"
                  className="w-full h-12 border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-2xl gap-2 font-bold tracking-wider uppercase text-[10px]"
                >
                  <RefreshCw className={cn("w-4 h-4", isRestarting && "animate-spin")} />
                  Reiniciar Conector
                </Button>
              </div>
            )}

            {!status.qrCodeData && !showLoader && !error && !status.lastError && (
               <Button 
                  onClick={handleRestart}
                  className="mt-8 w-full h-12 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors rounded-2xl gap-2 font-black text-[10px] tracking-widest uppercase"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Motor de QR
               </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
