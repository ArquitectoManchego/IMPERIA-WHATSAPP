'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Radio } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VoiceNoteRecorderProps {
  onSend: (audioBase64: string, isPtt: boolean) => Promise<void> | void;
  disabled?: boolean;
}

export default function VoiceNoteRecorder({ onSend, disabled }: VoiceNoteRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta grabación de voz.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      toast({
        title: 'Error de Micrófono',
        description: err.message || 'No se pudo acceder al micrófono para grabar la nota de voz.',
        variant: 'destructive'
      });
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    if (timerRef.current) clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          if (base64Data) {
            await onSend(base64Data, true); // Send as native PTT
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        toast({
          title: 'Error al procesar audio',
          description: err.message,
          variant: 'destructive'
        });
      } finally {
        setIsRecording(false);
        setRecordingSeconds(0);
        audioChunksRef.current = [];
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-in fade-in">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-bold">{formatSeconds(recordingSeconds)}</span>
          <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider hidden sm:inline">
            Grabando PTT...
          </span>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition"
            title="Cancelar grabación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={stopAndSend}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-950 transition flex items-center gap-1 text-xs font-semibold px-2.5"
            title="Enviar nota de voz en vivo"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition disabled:opacity-40"
      title="Grabar nota de voz nativa (PTT)"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
