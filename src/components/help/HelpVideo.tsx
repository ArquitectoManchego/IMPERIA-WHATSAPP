'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Maximize2, X, Film } from 'lucide-react';

interface HelpVideoProps {
  src: string;
  poster?: string;
  caption?: string;
  mediaType?: 'video' | 'gif' | 'image';
  loop?: boolean;
}

export default function HelpVideo({
  src,
  poster,
  caption,
  mediaType = 'video',
  loop = true,
}: HelpVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const isGif = mediaType === 'gif' || src.endsWith('.gif');

  return (
    <div className="my-6 space-y-2">
      <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
        {isGif ? (
          <img
            src={src}
            alt={caption || 'Demostración animada'}
            className="w-full h-auto object-contain max-h-[500px]"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              autoPlay
              muted
              loop={loop}
              playsInline
              className="w-full h-auto object-contain max-h-[500px] cursor-pointer"
              onClick={togglePlay}
            />

            {/* Video Controls Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={togglePlay}
                className="text-white hover:text-emerald-400 p-1 transition-colors"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="text-white hover:text-emerald-400 p-1 transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 pointer-events-none">
              <Film className="w-3 h-3" />
              <span>Demostración en vivo</span>
            </div>
          </>
        )}
      </div>

      {caption && (
        <p className="text-[11px] sm:text-xs text-slate-400 text-center italic font-medium pt-1">
          {caption}
        </p>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 text-white hover:text-rose-400 p-2 bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={src}
              controls
              autoPlay
              loop={loop}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10"
            />
            {caption && <p className="text-sm text-slate-300 mt-3 font-medium text-center">{caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
